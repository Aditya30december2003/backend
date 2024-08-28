import React from 'react';

const MappedReviews = ({ reviews }) => {
  if (reviews.length === 0) {
    return <p>No reviews yet.</p>;
  }

  return (
    <div>
      {reviews.map((review) => (
        <div key={review.id} className='border-b border-gray-200 py-4'>
          <p className='font-semibold'>{review.user.name}</p>
          <p className='mt-1'>{review.content}</p>
          <div className='mt-2 flex gap-2'>
            <button className='p-1 border border-gray-300 rounded bg-gray-100 hover:bg-gray-200'>
              👍 Like
            </button>
            <button className='p-1 border border-gray-300 rounded bg-gray-100 hover:bg-gray-200'>
              😍 Love
            </button>
            <button className='p-1 border border-gray-300 rounded bg-gray-100 hover:bg-gray-200'>
              🔥 Hot
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MappedReviews;
