import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { Send, CheckCircle, Info, Check, ArrowLeft, CreditCard } from 'lucide-react';

function SubmitTool() {
  const [categories, setCategories] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null); // null, 'fast', or 'featured'
  const [showPayment, setShowPayment] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [pricingType, setPricingType] = useState('Freemium');
  const [selectedCats, setSelectedCats] = useState([]);

  useEffect(() => {
    async function fetchCatsAndSettings() {
      try {
        const [catsRes, settingsRes] = await Promise.all([
          fetch(`${API_URL}/categories`),
          fetch(`${API_URL}/settings`)
        ]);
        if (catsRes.ok) setCategories(await catsRes.json());
        if (settingsRes.ok) setSettings(await settingsRes.json());
      } catch (err) {
        console.error('Error fetching categories or settings:', err);
      }
    }
    fetchCatsAndSettings();
  }, []);

  // Tự động tải PayPal SDK khi mở trang thanh toán và có cấu hình PayPal Client ID
  useEffect(() => {
    if (showPayment && settings?.paypal_client_id) {
      if (window.paypal) {
        setPaypalLoaded(true);
        return;
      }
      
      const existingScript = document.getElementById('paypal-sdk-script');
      if (existingScript) {
        setPaypalLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.id = 'paypal-sdk-script';
      script.src = `https://www.paypal.com/sdk/js?client-id=${settings.paypal_client_id}&currency=USD`;
      script.async = true;
      script.onload = () => {
        setPaypalLoaded(true);
      };
      script.onerror = (err) => {
        console.error('PayPal SDK loading failed:', err);
      };
      document.body.appendChild(script);
    }
  }, [showPayment, settings]);

  // Khởi dựng nút thanh toán PayPal khi SDK đã sẵn sàng
  useEffect(() => {
    if (showPayment && paypalLoaded && window.paypal) {
      const container = document.getElementById('paypal-button-container');
      if (container && container.innerHTML === '') {
        const price = selectedPlan === 'fast' ? '30.00' : '100.00';
        window.paypal.Buttons({
          createOrder: (data, actions) => {
            return actions.order.create({
              purchase_units: [{
                description: `${selectedPlan === 'fast' ? 'Fast Track' : 'Featured Listing'} Submission - NexToolX`,
                amount: {
                  value: price
                }
              }]
            });
          },
          onApprove: async (data, actions) => {
            return actions.order.capture().then(async (details) => {
              // Thanh toán thành công! Lưu công cụ vào database
              await handlePaymentSuccess();
            });
          },
          onError: (err) => {
            console.error('PayPal Smart Buttons error:', err);
            alert('PayPal payment failed or was cancelled. Please try again.');
          }
        }).render('#paypal-button-container');
      }
    }
  }, [showPayment, paypalLoaded, selectedPlan]);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setShowPayment(false);
    setSubmitted(false);
  };

  // Tự động tạo slug khi gõ tên
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    setSlug(val.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, ''));
  };

  const handleCatCheckbox = (catId) => {
    if (selectedCats.includes(catId)) {
      setSelectedCats(selectedCats.filter(id => id !== catId));
    } else {
      setSelectedCats([...selectedCats, catId]);
    }
  };

  const saveToolToDb = async () => {
    try {
      const res = await fetch(`${API_URL}/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          short_description: shortDesc,
          full_description: fullDesc,
          website_url: websiteUrl,
          pricing_type: pricingType,
          categories: selectedCats,
          status: 'pending',
          verified: 0,
          featured: selectedPlan === 'featured' ? 1 : 0,
          published: 0,
          contact_email: contactEmail,
          is_paid_submission: 1
        })
      });
      if (res.ok) {
        return { success: true };
      } else {
        const errorData = await res.json().catch(() => ({}));
        return { success: false, error: errorData.error || 'Server error' };
      }
    } catch (err) {
      console.error('Error saving tool details to database:', err);
      return { success: false, error: err.message || 'Connection error' };
    }
  };

  const handleSubmitDetails = async (e) => {
    e.preventDefault();
    if (!name || !shortDesc || !websiteUrl) return;

    const fastLink = settings?.paypal_fast_track_link;
    const featuredLink = settings?.paypal_featured_link;

    if (selectedPlan === 'fast' && fastLink) {
      setLoading(true);
      const result = await saveToolToDb();
      setLoading(false);
      if (result.success) {
        window.location.href = fastLink;
      } else {
        alert(`Could not save tool details: ${result.error}. Please try again.`);
      }
    } else if (selectedPlan === 'featured' && featuredLink) {
      setLoading(true);
      const result = await saveToolToDb();
      setLoading(false);
      if (result.success) {
        window.location.href = featuredLink;
      } else {
        alert(`Could not save tool details: ${result.error}. Please try again.`);
      }
    } else {
      setShowPayment(true);
    }
  };

  const handlePaymentSuccess = async () => {
    setLoading(true);
    const result = await saveToolToDb();
    setLoading(false);
    if (result.success) {
      setSubmitted(true);
      setShowPayment(false);
    } else {
      alert(`Payment simulated successfully, but could not save tool details: ${result.error}. Please try again.`);
    }
  };

  const handleReset = () => {
    setName('');
    setSlug('');
    setContactEmail('');
    setShortDesc('');
    setFullDesc('');
    setWebsiteUrl('');
    setPricingType('Freemium');
    setSelectedCats([]);
    setSelectedPlan(null);
    setShowPayment(false);
    setSubmitted(false);
  };

  // 1. If submission is fully completed and successful
  if (submitted) {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', padding: '40px 0' }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '40px', borderRadius: 'var(--radius-xl)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)' }}>
            <CheckCircle size={36} />
          </div>
          <div>
            <h2 style={{ fontSize: '26px', color: 'var(--text-primary)', fontWeight: '800' }}>Payment & Submission Successful!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '8px', maxWidth: '480px', margin: '8px auto 0', lineHeight: '1.6' }}>
              Thank you! Your payment for the <strong>{selectedPlan === 'fast' ? 'Fast Track ($30)' : 'Featured Listing ($100)'}</strong> plan has been processed. Our administrators will review the details and publish the tool within 24 hours.
            </p>
          </div>
          <button onClick={handleReset} className="submit-button" style={{ marginTop: '12px', padding: '10px 24px' }}>
            Submit Another Tool
          </button>
        </div>
      </div>
    );
  }

  // 2. If user is in the payment checkout screen
  if (showPayment) {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', padding: '40px 0' }}>
        <button 
          onClick={() => setShowPayment(false)} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', alignSelf: 'flex-start' }}
        >
          <ArrowLeft size={16} />
          <span>Back to edit details</span>
        </button>

        <div style={{ 
          maxWidth: '600px', 
          width: '100%', 
          margin: '0 auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '24px', 
          padding: '36px', 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border)', 
          borderRadius: 'var(--radius-lg)', 
          boxShadow: 'var(--shadow-glow)' 
        }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>Secure Payment Checkout</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
              Please complete payment for your <strong>{selectedPlan === 'fast' ? 'Fast Track' : 'Featured'}</strong> submission.
            </p>
          </div>

          {/* Pricing display */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Total Amount Due:</span>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#10b981' }}>{selectedPlan === 'fast' ? '$30' : '$100'}</span>
          </div>

          {/* Payment methods checkout */}
          {settings?.paypal_client_id ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', fontWeight: '600' }}>
                  Pay securely with PayPal or Credit Card
                </p>
                <div id="paypal-button-container" style={{ minHeight: '150px' }}></div>
                {!paypalLoaded && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '20px 0' }}>
                    Loading secure PayPal Smart Buttons...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Payment methods mock (Test/Simulation Mode) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px dashed var(--accent-amber)', borderRadius: '8px', padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <strong>⚠️ Test Simulation Mode:</strong> PayPal Client ID is not configured in settings. You can simulate a successful checkout using the test form below.
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', background: 'var(--bg-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <input type="radio" checked readOnly style={{ accentColor: '#10b981', width: '16px', height: '16px' }} />
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Credit / Debit Card (Stripe checkout)</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '28px' }}>
                    <input 
                      type="text" 
                      placeholder="Cardholder Name" 
                      className="form-control" 
                      style={{ fontSize: '13px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} 
                    />
                    <input 
                      type="text" 
                      placeholder="Card Number (4242 •••• •••• ••••)" 
                      maxLength="19"
                      className="form-control" 
                      style={{ fontSize: '13px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} 
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <input 
                        type="text" 
                        placeholder="MM / YY" 
                        maxLength="5"
                        className="form-control" 
                        style={{ fontSize: '13px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} 
                      />
                      <input 
                        type="text" 
                        placeholder="CVC / CVV" 
                        maxLength="4"
                        className="form-control" 
                        style={{ fontSize: '13px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} 
                      />
                    </div>
                  </div>
                </div>

                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', background: 'var(--bg-secondary)', opacity: 0.6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input type="radio" disabled style={{ accentColor: '#10b981' }} />
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)' }}>PayPal Express Checkout</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={handlePaymentSuccess}
                className="submit-button"
                disabled={loading}
                style={{ width: '100%', padding: '14px', fontWeight: '800', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', marginTop: '8px', cursor: 'pointer' }}
              >
                <CreditCard size={16} />
                <span>{loading ? 'Processing Payment...' : `Simulate Payment of ${selectedPlan === 'fast' ? '$30' : '$100'} & Submit`}</span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // 3. If plan is selected but details have not been entered (Show Tool Submission Form)
  if (selectedPlan !== null) {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', padding: '20px 0' }}>
        <button 
          onClick={() => setSelectedPlan(null)} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', alignSelf: 'flex-start' }}
        >
          <ArrowLeft size={16} />
          <span>Change pricing plan</span>
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '12px 20px', borderRadius: '12px' }}>
          <div>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: '700' }}>Selected Plan</span>
            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#10b981', margin: 0 }}>
              {selectedPlan === 'fast' ? 'Fast Track ($30)' : 'Featured Listing ($100)'}
            </h4>
          </div>
          <span style={{ fontSize: '12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>Step 2 of 3</span>
        </div>

        <form onSubmit={handleSubmitDetails} className="detail-card" style={{ padding: '32px' }}>
          <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <Info size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              All submitted tools will undergo a verification process. Make sure to provide accurate details, working links, and descriptive descriptions.
            </p>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Tool Name *</label>
            <input
              type="text"
              className="form-control"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Jasper AI"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Slug (URL Identifier) *</label>
            <input
              type="text"
              className="form-control"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. jasper-ai"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Contact Email *</label>
            <input
              type="email"
              className="form-control"
              required
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="e.g. contact@yourcompany.com"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              We will send your payment receipt, confirmation email, and verification status updates here.
            </p>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Website URL *</label>
            <input
              type="url"
              className="form-control"
              required
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Pricing Model *</label>
            <select
              className="form-control"
              value={pricingType}
              onChange={(e) => setPricingType(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              {['Free', 'Freemium', 'Paid', 'Free Trial'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Short Description (1-2 sentences) *</label>
            <input
              type="text"
              className="form-control"
              required
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="Briefly describe what this AI tool does..."
              maxLength="200"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Full Description (Optional)</label>
            <textarea
              className="form-control"
              rows="5"
              value={fullDesc}
              onChange={(e) => setFullDesc(e.target.value)}
              placeholder="Provide a detailed breakdown of features, integrations, and use cases..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            ></textarea>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Select Categories *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '160px', overflowY: 'auto', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
              {categories.map(cat => (
                <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedCats.includes(cat.id)}
                    onChange={() => handleCatCheckbox(cat.id)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  {cat.name}
                </label>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="submit-button" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px', padding: '12px', border: 'none', fontWeight: '700', cursor: 'pointer' }}
          >
            <Send size={16} />
            <span>Continue to Payment Checkout</span>
          </button>
        </form>
      </div>
    );
  }

  // 4. Default View: Select pricing plan cards
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', padding: '20px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h1 style={{ fontSize: '38px', fontWeight: '800', color: 'var(--text-primary)' }}>Submit your tool</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '12px', fontSize: '16px' }}>
          Submit your tool and reach 1m+ qualified users actively searching for AI tools like yours every month.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '32px',
        marginTop: '20px'
      }}>
        {/* Plan 1: Fast Track */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '24px',
          position: 'relative'
        }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#10b981', margin: '0 0 16px 0' }}>Fast Track</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '24px' }}>
              <span style={{ fontSize: '42px', fontWeight: '900', color: 'var(--text-primary)' }}>$30</span>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>one-time</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>Live within 24 hrs (no queue)</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>Just landed section (Homepage)</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>Permanent listing</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>Free listing edits</span>
              </li>
            </ul>
          </div>
          <button 
            onClick={() => handleSelectPlan('fast')}
            className="submit-button" 
            style={{ width: '100%', padding: '14px', fontSize: '14px', fontWeight: '800', letterSpacing: '0.5px', marginTop: '16px', border: 'none', cursor: 'pointer' }}
          >
            SUBMIT NOW
          </button>
        </div>

        {/* Plan 2: Featured Listing */}
        <div style={{
          background: 'var(--bg-card)',
          border: '2px solid #10b981',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '24px',
          position: 'relative',
          boxShadow: '0 10px 30px -10px rgba(16, 185, 129, 0.2)'
        }}>
          {/* Best Value Badge */}
          <div style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#10b981',
            color: '#fff',
            padding: '4px 12px',
            fontSize: '11px',
            fontWeight: '800',
            borderRadius: '12px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Best Value
          </div>

          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#10b981', margin: '0 0 16px 0' }}>Featured Listing</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '24px' }}>
              <span style={{ fontSize: '42px', fontWeight: '900', color: 'var(--text-primary)' }}>$100</span>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>one-time · Featured for 7 days</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                <strong>Everything in Fast Track</strong>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>Featured on homepage + other sections</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>Boosted search results for relevant keywords</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>Top spots in category page</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>Faster verification process</span>
              </li>
            </ul>
          </div>
          <button 
            onClick={() => handleSelectPlan('featured')}
            className="submit-button" 
            style={{ width: '100%', padding: '14px', fontSize: '14px', fontWeight: '800', letterSpacing: '0.5px', marginTop: '16px', border: 'none', cursor: 'pointer' }}
          >
            GET BOOSTED
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '700px', margin: '24px auto 0', lineHeight: '1.6' }}>
        All tool submissions are subject to editorial review. You receive an automated refund if your tool is not accepted. By submitting your tool you agree to our <a href="/terms" style={{ color: '#10b981', textDecoration: 'none', fontWeight: '600' }}>Terms of Service</a>.
      </div>
    </div>
  );
}

export default SubmitTool;
