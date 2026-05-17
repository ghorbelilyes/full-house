import React, { useState, useCallback } from 'react';
import { useProduct } from '@components/frontStore/catalog/ProductContext.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';

/* ── Star Rating Input ── */
function StarInput({
  value,
  onChange,
  disabled = false
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => !disabled && setHover(0)}
          onClick={() => !disabled && onChange(star === value ? 0 : star)}
          style={{
            background: 'none',
            border: 'none',
            cursor: disabled ? 'default' : 'pointer',
            fontSize: '28px',
            color: star <= (hover || value) ? '#f59e0b' : '#d1d5db',
            transition: 'color 0.15s, transform 0.15s',
            transform: star <= hover ? 'scale(1.15)' : 'scale(1)',
            padding: '2px'
          }}
          aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/* ── Star Display (read-only) ── */
function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: '#f59e0b', fontSize: '16px', letterSpacing: '2px' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s}>{s <= rating ? '★' : '☆'}</span>
      ))}
    </span>
  );
}

/* ── Edit (pencil) icon ── */
function EditIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

/* ── Review Edit Form (inline) ── */
function ReviewEditForm({
  initialRating,
  initialComment,
  productId,
  customer,
  onSaved,
  onCancel
}: {
  initialRating: number;
  initialComment: string;
  productId: number;
  customer: any;
  onSaved: (review: any) => void;
  onCancel: () => void;
}) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: string;
    text: string;
  } | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!productId || rating === 0) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/products/${productId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ rating, comment })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({
          type: 'success',
          text: _('Your review has been saved!')
        });
        onSaved({
          reviewId: data.data?.review_id || Date.now(),
          customerId: customer?.customerId,
          customerName: customer?.fullName || 'Client',
          rating,
          comment,
          createdAt: new Date().toISOString()
        });
      } else {
        setMessage({
          type: 'error',
          text: data.message || _('Error submitting review')
        });
      }
    } catch {
      setMessage({ type: 'error', text: _('Error submitting review') });
    } finally {
      setSubmitting(false);
    }
  }, [productId, rating, comment, customer, onSaved]);

  return (
    <div
      style={{
        background: '#f9fafb',
        borderRadius: '14px',
        padding: '20px',
        border: '1px solid #e5e7eb',
        marginTop: '8px'
      }}
    >
      <div style={{ marginBottom: '12px' }}>
        <div
          style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '6px'
          }}
        >
          {_('Your rating')}
        </div>
        <StarInput value={rating} onChange={setRating} />
      </div>
      <div style={{ marginBottom: '12px' }}>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={_('Your comment (optional)')}
          rows={3}
          style={{
            width: '100%',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '14px',
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
          style={{
            background: rating === 0 ? '#d1d5db' : '#e48125',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '10px 20px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: rating === 0 ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            opacity: submitting ? 0.7 : 1
          }}
        >
          {submitting ? _('Submitting...') : _('Save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: 'none',
            border: '1px solid #d1d5db',
            borderRadius: '12px',
            padding: '10px 20px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            color: '#6b7280'
          }}
        >
          {_('Cancel')}
        </button>
      </div>
      {message && (
        <div
          style={{
            marginTop: '12px',
            fontSize: '14px',
            color: message.type === 'success' ? '#065f46' : '#dc2626',
            background:
              message.type === 'success' ? '#d1fae5' : '#fef2f2',
            padding: '8px 12px',
            borderRadius: '8px'
          }}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}

export default function ProductReviews({
  reviews: reviewData,
  customer
}: {
  reviews: any;
  customer: any;
}) {
  const product = useProduct();
  const reviewSummary = reviewData?.reviewSummary || {
    averageRating: 0,
    totalReviews: 0,
    reviews: [],
    customerReview: null
  };
  const productId = product?.productId;
  const isLoggedIn = !!customer;
  const hasExistingReview = !!reviewSummary.customerReview;

  const [reviews, setReviews] = useState(reviewSummary.reviews || []);
  // editing = true means the inline edit form is open
  const [editing, setEditing] = useState(false);
  // For new reviews (no existing review), show the form directly
  const [showNewForm, setShowNewForm] = useState(false);

  const handleSaved = useCallback(
    (newReview: any) => {
      const existingIdx = reviews.findIndex(
        (r: any) => r.customerId === customer?.customerId
      );
      if (existingIdx >= 0) {
        const updated = [...reviews];
        updated[existingIdx] = newReview;
        setReviews(updated);
      } else {
        setReviews([newReview, ...reviews]);
      }
      setEditing(false);
      setShowNewForm(false);
    },
    [reviews, customer]
  );

  return (
    <div
      className="page-width"
      style={{ marginTop: '40px', marginBottom: '40px' }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.04)'
        }}
      >
        <h3
          style={{
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '24px'
          }}
        >
          {_('Customer Reviews')}
        </h3>

        {/* ── Write-a-review area ── */}
        {!(isLoggedIn && hasExistingReview && !editing) && (
        <div
          style={{
            background: '#f9fafb',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '28px',
            border: '1px solid #e5e7eb'
          }}
        >
          {isLoggedIn ? (
            hasExistingReview ? (
              editing ? (
                /* ── Active edit form (shown only when editing) ── */
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}
                  >
                    <div
                      className="review-section-title"
                      style={{
                        fontWeight: 600,
                        fontSize: '16px'
                      }}
                    >
                      {_('Edit your review')}
                    </div>
                  </div>
                  <ReviewEditForm
                    initialRating={reviewSummary.customerReview.rating}
                    initialComment={reviewSummary.customerReview.comment || ''}
                    productId={productId}
                    customer={customer}
                    onSaved={handleSaved}
                    onCancel={() => setEditing(false)}
                  />
                </div>
              ) : null
            ) : showNewForm ? (
              /* ── New review form ── */
              <ReviewEditForm
                initialRating={0}
                initialComment=""
                productId={productId}
                customer={customer}
                onSaved={handleSaved}
                onCancel={() => setShowNewForm(false)}
              />
            ) : (
              /* ── Prompt to leave a new review ── */
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ fontSize: '15px', fontWeight: 600 }}>
                  {_('Have you used this product? Share your opinion!')}
                </span>
                <button
                  type="button"
                  onClick={() => setShowNewForm(true)}
                  style={{
                    background: '#e48125',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px 20px',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  {_('Leave a review')}
                </button>
              </div>
            )
          ) : (
            /* ── Not logged in ── */
            <div
              style={{
                textAlign: 'center',
                padding: '12px',
                color: '#6b7280'
              }}
            >
              <span style={{ fontSize: '14px' }}>
                {_('You must be logged in to leave a review')}.{' '}
                <a
                  href="/account/login"
                  style={{
                    color: '#e48125',
                    fontWeight: 600,
                    textDecoration: 'underline'
                  }}
                >
                  {_('Log in')}
                </a>
              </span>
            </div>
          )}
        </div>
        )}

        {/* ── Reviews list ── */}
        {reviews.length > 0 ? (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {reviews.map((review: any, i: number) => {
              const isOwnReview =
                isLoggedIn && review.customerId === customer?.customerId;

              return (
                <div
                  key={review.reviewId || i}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '14px',
                    border: isOwnReview
                      ? '1px solid #fcd9b6'
                      : '1px solid #e5e7eb',
                    background: isOwnReview ? '#fffbf5' : '#fff'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '15px'
                        }}
                      >
                        {review.customerName}
                      </span>
                      {isOwnReview && (
                        <span
                          style={{
                            fontSize: '11px',
                            background: '#e48125',
                            color: '#fff',
                            borderRadius: '6px',
                            padding: '2px 8px',
                            fontWeight: 700
                          }}
                        >
                          {_('You')}
                        </span>
                      )}
                      <Stars rating={review.rating} />
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {new Date(review.createdAt).toLocaleDateString(
                          'fr-FR'
                        )}
                      </span>
                      {isOwnReview && (
                        <button
                          type="button"
                          onClick={() => setEditing(true)}
                          title={_('Edit your review')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#e48125',
                            padding: '4px',
                            borderRadius: '6px',
                            transition: 'background 0.15s'
                          }}
                        >
                          <EditIcon />
                        </button>
                      )}
                    </div>
                  </div>
                  {review.comment && (
                    <p
                      style={{
                        fontSize: '14px',
                        color: '#374151',
                        margin: 0,
                        lineHeight: 1.6
                      }}
                    >
                      {review.comment}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '24px',
              color: '#9ca3af',
              fontSize: '14px'
            }}
          >
            {_('No reviews yet. Be the first to leave a review!')}
          </div>
        )}
      </div>
    </div>
  );
}

export const layout = {
  areaId: 'productPageBottom',
  sortOrder: 10
};

export const query = `
query Query {
  reviews: currentProduct {
    reviewSummary {
      averageRating
      totalReviews
      reviews {
        reviewId
        customerId
        customerName
        rating
        comment
        createdAt
      }
      customerReview {
        reviewId
        rating
        comment
      }
    }
  }
  customer: currentCustomer {
    customerId
    fullName
  }
}`;
