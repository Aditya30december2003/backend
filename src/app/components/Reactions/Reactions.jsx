// components/Reaction.js

import React from 'react';
import { BsEmojiLaughing } from 'react-icons/bs';
import { CiHeart } from 'react-icons/ci';
import { AiOutlineFire } from 'react-icons/ai';

const Reaction = ({ reviewId, emojis, likes, fire, onReact }) => {
  return (
    <div className='flex items-center gap-4 mt-5'>
      <div
        className='cursor-pointer flex items-center'
        onClick={() => onReact(reviewId, 'emojis')}
      >
        <BsEmojiLaughing size={15} />
        <span className="ml-1">{emojis || 0}</span>
      </div>
      <div
        className='cursor-pointer flex items-center'
        onClick={() => onReact(reviewId, 'likes')}
      >
        <CiHeart size={17} />
        <span className="ml-1">{likes || 0}</span>
      </div>
      <div
        className='cursor-pointer flex items-center'
        onClick={() => onReact(reviewId, 'fire')}
      >
        <AiOutlineFire size={15} />
        <span className="ml-1">{fire || 0}</span>
      </div>
    </div>
  );
};

export default Reaction;
