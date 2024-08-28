import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Reaction from '../Reactions/Reactions'; // Import the Reaction component

const Review = ({ movieId }) => {
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentVisibility, setCommentVisibility] = useState({});
  const [commentText, setCommentText] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/review?movieId=${movieId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }
        const data = await response.json();
        setReviews(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchReviews();
    }
  }, [movieId]);

  const toggleCommentVisibility = (reviewId) => {
    setCommentVisibility(prevState => ({
      ...prevState,
      [reviewId]: !prevState[reviewId]
    }));
  };

  const handleReaction = async (reviewId, type) => {
    window.location.reload()
    try {
        const response = await fetch('/api/reaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                reviewId,
                type,
                action: 'reaction'
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to update reaction');
        }

        const updatedReview = await response.json();
        setReviews((prevReviews) =>
            prevReviews.map((review) =>
                review.id === reviewId ? updatedReview : review
            )
        );
    } catch (error) {
        console.error(error);
    }
};

  const handleSubmit = async () => {
    window.location.reload()
    if (!reviewText.trim()) return;

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ movieId, reviewText }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      const newReview = await response.json();
      setReviews([...reviews, newReview]);
      setReviewText('');
      setError(null); // Clear error on successful submission
    } catch (error) {
      setError(error.message); // Set error message for user feedback
      console.error(error);
    }
  };

  const handleCommentSubmit = async (reviewId, commentText) => {
    if (!commentText.trim()) return;

    try {
      const response = await fetch('/api/reviewComments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviewId, comment: commentText }), // Updated field names
      });

      if (!response.ok) {
        throw new Error('Failed to submit comment');
      }

      // Assuming the API returns the updated review with comments
      const updatedReview = await response.json();
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === reviewId ? updatedReview : review
        )
      );

      // Clear the comment input for the specific review
      setCommentText(prev => ({ ...prev, [reviewId]: '' }));
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2 className="text-[2rem] font-bold mb-4 p-2">Reviews</h2>
      <div className="mb-4 flex items-center p-3 gap-2">
        <input
          type="text"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Enter your review"
          className="border p-2 rounded w-full"
        />
        <button 
          onClick={handleSubmit}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Submit
        </button>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <div>
        {reviews.map((review) => (
          <div key={review.id} className="flex w-full gap-4 p-4 border-b border-gray-300">
            <div className="w-[5%] h-[5%]">
              {review.user?.image ? (
                <Image 
                  className='w-full h-full rounded-full' 
                  src={review.user.image} 
                  width={100} 
                  height={100} 
                  alt='Profile Image' 
                />
              ) : (
                <Image 
                  className='w-full h-full rounded-full border-2 border-gray-300' 
                  src='/img/profile.png' 
                  width={100} 
                  height={100} 
                  alt='Default Profile Image' 
                />
              )}
            </div>
            <div className='w-[95%]'>
              <div>
                <p className="font-semibold">{review.user?.name || 'Anonymous'}</p>
              </div>
              <p className='italic'>{review.content}</p>
              <div className='flex items-center gap-4'>
              <Reaction 
                reviewId={review.id}
                emojis={review.emojis}
                likes={review.likes}
                fire={review.fire}
                onReact={handleReaction}
              />
              <div>
                <button 
                  onClick={() => toggleCommentVisibility(review.id)} 
                  className='text-gray-500 text-[0.8rem] mt-5'
                >
                  Comment
                </button>
              </div>
              </div>
              {commentVisibility[review.id] && (
                <div className='mt-2 w-full flex items-center gap-2'>
                  <input 
                    type="text" 
                    value={commentText[review.id] || ''} // Manage comment text state
                    onChange={(e) => setCommentText(prev => ({ ...prev, [review.id]: e.target.value }))}
                    placeholder='Comment your thoughts' 
                    className='outline-none border-b-2 border-gray-400 w-[90%]'
                  />
                  <div>
                    <button 
                      onClick={() => handleCommentSubmit(review.id, commentText[review.id])} 
                      className='bg-blue-500 p-1 text-white text-[0.8rem]'
                    >
                      Comment
                    </button>
                  </div>
                </div>
              )}
              {/* Display existing comments */}
              {review.comments && review.comments.map(comment => (
                <div key={comment.id} className="mt-2 ml-6">
                  <p className="text-sm"><strong>{comment.user.name}:</strong> {comment.comment}</p>
                </div>
              ))}
            </div>
          </div>      
        ))}
      </div>
    </div>
  );
};

export default Review;
