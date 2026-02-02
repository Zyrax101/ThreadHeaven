"""
Thread Heaven - Production Flask Server
=====================================
E-commerce backend with PayPal payments and Resend email notifications.

Run with: python app.py
"""

import os
import json
import time
import secrets
import hashlib
import requests
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from dotenv import load_dotenv
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app, origins=['http://localhost:5000', 'http://127.0.0.1:5000'])

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Resend Configuration
RESEND_API_KEY = os.getenv('RESEND_API_KEY')
EMAIL_FROM_NAME = os.getenv('EMAIL_FROM_NAME', 'Thread Heaven')
EMAIL_FROM_ADDRESS = os.getenv('EMAIL_FROM_ADDRESS', 'no-reply@threadheaven.eu')

# PayPal Configuration
PAYPAL_PAYMENT_LINK = os.getenv('PAYPAL_PAYMENT_LINK', 'https://www.paypal.com/ncp/payment/H5VU57MBUX9EL')

# Supabase Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')

# Initialize Supabase client
supabase_client = None
try:
    if SUPABASE_URL and SUPABASE_ANON_KEY:
        from supabase import create_client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        print("[OK] Supabase client initialized")
except Exception as e:
    print(f"[WARNING] Supabase not available: {e}")

# ============================================================================
# RESEND EMAIL SERVICE
# ============================================================================

def send_email(to_email, subject, order_data=None):
    """
    Send an email using Resend API.
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        order_data: Optional dictionary with order details
    
    Returns:
        dict with 'success' and 'id' or 'error'
    """
    if not RESEND_API_KEY:
        print("[WARNING] Resend not configured - email not sent")
        return {'success': False, 'error': 'Email service not configured'}
    
    try:
        # Build email HTML
        if order_data:
            items_html = ''.join([
                f"<tr><td style='padding:8px;border-bottom:1px solid #333;'>{item.get('name', 'Item')}</td>"
                f"<td style='padding:8px;border-bottom:1px solid #333;'>{item.get('quantity', 1)}</td>"
                f"<td style='padding:8px;border-bottom:1px solid #333;'>${item.get('price', 0)}</td></tr>"
                for item in order_data.get('items', [])
            ])
            
            html_content = f"""
            <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e5e5e5; padding: 40px;">
                <h1 style="color: #c5a028; margin-bottom: 24px;">Thread Heaven</h1>
                <h2 style="color: white; margin-bottom: 16px;">Order Confirmation</h2>
                <p style="color: #999; margin-bottom: 24px;">Thank you for your order, {order_data.get('customerName', 'Customer')}!</p>
                
                <div style="background: #121212; padding: 20px; margin-bottom: 24px; border: 1px solid #333;">
                    <p style="margin: 0; color: #999;">Order ID</p>
                    <p style="margin: 4px 0 0; color: #c5a028; font-size: 18px;">{order_data.get('orderId', 'N/A')}</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                    <thead>
                        <tr style="background: #1a1a1a;">
                            <th style="padding: 12px; text-align: left; color: #999;">Item</th>
                            <th style="padding: 12px; text-align: left; color: #999;">Qty</th>
                            <th style="padding: 12px; text-align: left; color: #999;">Price</th>
                        </tr>
                    </thead>
                    <tbody>{items_html}</tbody>
                </table>
                
                <div style="text-align: right; margin-bottom: 24px;">
                    <span style="color: #999;">Total: </span>
                    <span style="color: #c5a028; font-size: 20px;">{order_data.get('total', '$0')}</span>
                </div>
                
                <p style="color: #666; font-size: 12px;">
                    Please complete your payment via PayPal if you haven't already.<br>
                    Questions? Reply to this email.
                </p>
            </div>
            """
        else:
            html_content = f"""
            <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e5e5e5; padding: 40px;">
                <h1 style="color: #c5a028;">Thread Heaven</h1>
                <p>Thank you for your order!</p>
            </div>
            """
        
        response = requests.post(
            'https://api.resend.com/emails',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {RESEND_API_KEY}'
            },
            json={
                'from': f'{EMAIL_FROM_NAME} <{EMAIL_FROM_ADDRESS}>',
                'to': [to_email],
                'subject': subject,
                'html': html_content
            },
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"[OK] Email sent to {to_email}: {result.get('id')}")
            return {'success': True, 'id': result.get('id')}
        else:
            print(f"[ERROR] Email failed: {response.status_code} - {response.text}")
            return {'success': False, 'error': response.text}
            
    except Exception as e:
        print(f"[ERROR] Email error: {e}")
        return {'success': False, 'error': str(e)}

# ============================================================================
# CUSTOM AUTH - EMAIL VERIFICATION
# ============================================================================

# In-memory storage for pending verifications (use Redis/DB in production)
pending_verifications = {}

def send_verification_email(to_email, token):
    """Send email verification link via Resend"""
    if not RESEND_API_KEY:
        return {'success': False, 'error': 'Email not configured'}
    
    verify_link = f"http://localhost:5000/verify?token={token}"
    
    html_content = f"""
    <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e5e5e5; padding: 40px;">
        <h1 style="color: #c5a028; margin-bottom: 24px;">Thread Heaven</h1>
        <h2 style="color: white; margin-bottom: 16px;">Verify Your Email</h2>
        <p style="color: #999; margin-bottom: 24px;">Thanks for signing up! Click the button below to verify your email address.</p>
        
        <a href="{verify_link}" style="display: inline-block; padding: 16px 32px; background: #c5a028; color: black; text-decoration: none; font-weight: bold; letter-spacing: 0.1em; margin-bottom: 24px;">VERIFY EMAIL</a>
        
        <p style="color: #666; font-size: 12px; margin-top: 24px;">
            Or copy this link: {verify_link}<br><br>
            This link expires in 24 hours.
        </p>
    </div>
    """
    
    try:
        response = requests.post(
            'https://api.resend.com/emails',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {RESEND_API_KEY}'
            },
            json={
                'from': f'{EMAIL_FROM_NAME} <{EMAIL_FROM_ADDRESS}>',
                'to': [to_email],
                'subject': 'Verify your email - Thread Heaven',
                'html': html_content
            },
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"[OK] Verification email sent to {to_email}")
            return {'success': True}
        else:
            print(f"[ERROR] Verification email failed: {response.text}")
            return {'success': False, 'error': response.text}
    except Exception as e:
        print(f"[ERROR] Verification email error: {e}")
        return {'success': False, 'error': str(e)}


@app.route('/api/auth/signup', methods=['POST'])
@limiter.limit("10 per minute")
def custom_signup():
    """Custom signup with email verification via Resend"""
    try:
        data = request.get_json()
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        name = data.get('name', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        # Check if email already has pending verification
        for token_key, user_data in pending_verifications.items():
            if user_data.get('email') == email:
                return jsonify({'error': 'A verification email was already sent to this address'}), 400
        
        # Check if email already exists in Supabase
        if supabase_client:
            try:
                existing = supabase_client.table('users').select('email').eq('email', email).execute()
                if existing.data and len(existing.data) > 0:
                    return jsonify({'error': 'An account with this email already exists'}), 400
            except Exception as e:
                print(f"[WARNING] Could not check existing user: {e}")
        
        # Generate verification token
        token = secrets.token_urlsafe(32)
        
        # Hash password
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        # Store pending verification
        pending_verifications[token] = {
            'email': email,
            'password_hash': password_hash,
            'name': name,
            'created_at': time.time()
        }
        
        # Send verification email
        result = send_verification_email(email, token)
        
        if result.get('success'):
            return jsonify({
                'success': True,
                'message': 'Verification email sent! Please check your inbox.'
            })
        else:
            return jsonify({'error': 'Could not send verification email'}), 500
            
    except Exception as e:
        print(f"[ERROR] Signup error: {e}")
        return jsonify({'error': 'Signup failed'}), 500


@app.route('/verify')
def verify_email():
    """Verify email and create Supabase user"""
    token = request.args.get('token')
    
    if not token or token not in pending_verifications:
        return """
        <html>
        <head><title>Verification Failed</title></head>
        <body style="background:#050505;color:#e5e5e5;font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;">
            <div style="text-align:center;">
                <h1 style="color:#e74c3c;">Verification Failed</h1>
                <p>Invalid or expired verification link.</p>
                <a href="/account.html" style="color:#c5a028;">Back to Account</a>
            </div>
        </body>
        </html>
        """, 400
    
    user_data = pending_verifications.pop(token)
    
    # Check if token is expired (24 hours)
    if time.time() - user_data['created_at'] > 86400:
        return """
        <html>
        <head><title>Link Expired</title></head>
        <body style="background:#050505;color:#e5e5e5;font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;">
            <div style="text-align:center;">
                <h1 style="color:#e74c3c;">Link Expired</h1>
                <p>This verification link has expired. Please sign up again.</p>
                <a href="/account.html" style="color:#c5a028;">Back to Account</a>
            </div>
        </body>
        </html>
        """, 400
    
    # Save verified user to our users table
    user_created = False
    if supabase_client:
        try:
            supabase_client.table('users').insert({
                'email': user_data['email'],
                'name': user_data.get('name', ''),
                'password_hash': user_data['password_hash'],
                'verified': True
            }).execute()
            user_created = True
            print(f"[OK] User created: {user_data['email']}")
        except Exception as e:
            print(f"[WARNING] Could not save user: {e}")
    
    # Generate a login token for auto-login
    login_token = secrets.token_urlsafe(32)
    pending_logins = getattr(app, 'pending_logins', {})
    pending_logins[login_token] = {
        'email': user_data['email'],
        'password_hash': user_data['password_hash'],
        'created_at': time.time()
    }
    app.pending_logins = pending_logins
    
    # Return page that auto-logs in via Supabase
    return f"""
    <html>
    <head>
        <title>Email Verified!</title>
        <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
        <script src="/js/config.js"></script>
    </head>
    <body style="background:#050505;color:#e5e5e5;font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;">
        <div style="text-align:center;">
            <h1 style="color:#2ecc71;">Email Verified!</h1>
            <p>Your email <strong style="color:#c5a028;">{user_data['email']}</strong> has been verified.</p>
            <p style="color:#888;" id="status">Logging you in...</p>
            <a href="/account.html" style="color:#c5a028;">Click here if not redirected</a>
        </div>
        <script>
            (async function() {{
                try {{
                    // Create Supabase client
                    const {{ createClient }} = supabase;
                    const sb = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
                    
                    // Sign up user in Supabase Auth (this creates the auth user)
                    const {{ data, error }} = await sb.auth.signUp({{
                        email: '{user_data['email']}',
                        password: '{user_data['password_hash']}',
                        options: {{
                            data: {{
                                full_name: '{user_data.get("name", "")}'
                            }},
                            emailRedirectTo: window.location.origin + '/account.html'
                        }}
                    }});
                    
                    if (error && !error.message.includes('already registered')) {{
                        console.error('Signup error:', error);
                    }}
                    
                    // Now sign in
                    const signInResult = await sb.auth.signInWithPassword({{
                        email: '{user_data['email']}',
                        password: '{user_data['password_hash']}'
                    }});
                    
                    if (signInResult.error) {{
                        document.getElementById('status').textContent = 'Account created! Please sign in.';
                    }}
                    
                    // Redirect to account page
                    setTimeout(() => {{
                        window.location.href = '/account.html';
                    }}, 1500);
                }} catch (e) {{
                    console.error('Auto-login error:', e);
                    document.getElementById('status').textContent = 'Account created! Please sign in.';
                    setTimeout(() => {{
                        window.location.href = '/account.html';
                    }}, 2000);
                }}
            }})();
        </script>
    </body>
    </html>
    """


# ============================================================================
# STATIC FILE ROUTES
# ============================================================================

@app.route('/')
def index():
    """Serve the main store page"""
    return send_file('index.html')

@app.route('/admin')
@app.route('/admin.html')
def admin():
    """Serve the admin dashboard"""
    return send_file('admin.html')

@app.route('/shipping')
@app.route('/shipping.html')
def shipping():
    """Serve the shipping page"""
    return send_file('shipping.html')

@app.route('/contact')
@app.route('/contact.html')
def contact():
    """Serve the contact page"""
    return send_file('contact.html')

@app.route('/<path:path>')
def static_files(path):
    """Serve static files (js, css, assets)"""
    return send_from_directory('.', path)

# ============================================================================
# API CONFIGURATION ENDPOINT
# ============================================================================

@app.route('/api/config')
def get_config():
    """Return configuration for frontend"""
    return jsonify({
        'paypalPaymentLink': PAYPAL_PAYMENT_LINK,
        'emailConfigured': bool(RESEND_API_KEY)
    })

# ============================================================================
# ORDER API ENDPOINTS
# ============================================================================

@app.route('/api/orders', methods=['POST'])
@limiter.limit("5 per minute")  # Prevent order spam
def create_order():
    """
    Create an order after PayPal payment.
    Called from frontend after customer completes PayPal checkout.
    
    Expected body:
    {
        "customer": {"email": "...", "name": "...", "address": "...", "city": "...", "zip": "..."},
        "items": [{"id": "...", "name": "...", "price": 100, "quantity": 1, "size": "M"}],
        "paypalTransactionId": "optional PayPal transaction ID"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Invalid request body'}), 400
        
        customer = data.get('customer', {})
        items = data.get('items', [])
        paypal_id = data.get('paypalTransactionId', '')
        
        if not customer.get('email'):
            return jsonify({'error': 'Email is required'}), 400
        
        if not items:
            return jsonify({'error': 'No items in order'}), 400
        
        # Calculate total
        total = sum(item.get('price', 0) * item.get('quantity', 1) for item in items)
        
        # Generate order ID
        order_id = f"TH-{int(time.time())}"
        
        # Create order object
        order = {
            'order_id': order_id,
            'customer_email': customer.get('email'),
            'customer_name': customer.get('name', ''),
            'shipping_address': f"{customer.get('address', '')}, {customer.get('city', '')} {customer.get('zip', '')}",
            'items': items,
            'total': total,
            'paypal_transaction_id': paypal_id,
            'status': 'paid',
            'created_at': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        
        print(f"\n{'='*50}")
        print(f"[NEW ORDER] {order_id}")
        print(f"{'='*50}")
        print(f"Customer: {customer.get('name')} <{customer.get('email')}>")
        print(f"Total: ${total:.2f}")
        print(f"Items: {len(items)}")
        for item in items:
            print(f"  - {item.get('name')} x{item.get('quantity')} (${item.get('price')})")
        print(f"{'='*50}\n")
        
        # Save order to Supabase (for user dashboard)
        if supabase_client:
            try:
                supabase_order = {
                    'id': order_id,
                    'customer_email': customer.get('email'),
                    'customer_name': customer.get('name', ''),
                    'shipping_address': f"{customer.get('address', '')}, {customer.get('city', '')} {customer.get('zip', '')}",
                    'items': items,
                    'total': total,
                    'status': 'paid'
                }
                supabase_client.table('orders').insert(supabase_order).execute()
                print(f"[OK] Order saved to Supabase")
            except Exception as db_error:
                print(f"[WARNING] Could not save to Supabase: {db_error}")
        
        # Send confirmation email
        email_result = send_email(
            customer.get('email'),
            f'Order Confirmation - {order_id}',
            {
                'orderId': order_id,
                'customerName': customer.get('name', 'Customer'),
                'total': f"${total:.2f}",
                'items': items
            }
        )
        
        return jsonify({
            'success': True,
            'orderId': order_id,
            'emailSent': email_result.get('success', False),
            'message': 'Order created successfully'
        })
        
    except Exception as e:
        print(f"[ERROR] Error creating order: {e}")
        return jsonify({'error': 'Failed to create order'}), 500

@app.route('/api/orders/<order_id>')
def get_order(order_id):
    """Get order details by ID"""
    # In production, this would query Supabase
    return jsonify({
        'order_id': order_id,
        'status': 'processing',
        'message': 'Order details would be fetched from database'
    })

# ============================================================================
# EMAIL API ENDPOINTS
# ============================================================================

@app.route('/api/send-email', methods=['POST'])
@limiter.limit("30 per minute")  # Email rate limit
def send_email_endpoint():
    """
    Send an email via Resend.
    
    Expected body:
    {
        "to": "email@example.com",
        "template": "Welcome",
        "data": { optional template variables }
    }
    """
    try:
        data = request.get_json()
        
        to_email = data.get('to')
        template = data.get('template', 'Welcome')
        template_data = data.get('data', {})
        
        if not to_email:
            return jsonify({'error': 'Email address required'}), 400
        
        result = send_email(to_email, template, template_data)
        
        if result.get('success'):
            return jsonify(result)
        else:
            return jsonify(result), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# CONTACT FORM ENDPOINT
# ============================================================================

@app.route('/api/contact', methods=['POST'])
@limiter.limit("3 per minute")  # Strict limit on contact form
def contact_form():
    """Handle contact form submissions"""
    try:
        data = request.get_json()
        
        name = data.get('name', '')
        email = data.get('email', '')
        message = data.get('message', '')
        
        if not email or not message:
            return jsonify({'error': 'Email and message are required'}), 400
        
        print(f"\n[CONTACT] New Contact Form Submission")
        print(f"From: {name} <{email}>")
        print(f"Message: {message[:100]}...")
        
        # Could send email notification to admin here
        
        return jsonify({
            'success': True,
            'message': 'Thank you for your message. We will get back to you soon.'
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to submit form'}), 500

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.route('/api/health')
def health_check():
    """API health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'email_configured': bool(RESEND_API_KEY),
        'paypal_link': PAYPAL_PAYMENT_LINK,
        'version': '1.0.0'
    })

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Endpoint not found'}), 404
    return send_file('index.html')

@app.errorhandler(500)
def server_error(e):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500

# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == '__main__':
    print("\n" + "=" * 50)
    print("[*] Thread Heaven Production Server")
    print("=" * 50)
    print(f"Store:     http://localhost:5000")
    print(f"Admin:     http://localhost:5000/admin")
    print(f"API:       http://localhost:5000/api/health")
    print("=" * 50)
    
    if RESEND_API_KEY:
        print("[OK] Resend Email: Configured")
    else:
        print("[!!] Resend Email: NOT CONFIGURED")
    
    print(f"[OK] PayPal: {PAYPAL_PAYMENT_LINK[:50]}...")
    print("=" * 50 + "\n")
    
    app.run(debug=os.getenv('FLASK_DEBUG', '0') == '1', port=5000, host='0.0.0.0')
