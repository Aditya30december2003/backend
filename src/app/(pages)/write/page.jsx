"use client"
import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles

const Page = () => {
  const [title, setTitle] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [content, setContent] = useState('');
  const [thumbnail, setThumbnail] = useState(null);

  // Customize Quill modules (toolbar options)
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
  };

  // Handle thumbnail file change
  const handleFileChange = (e) => {
    setThumbnail(e.target.files[0]);
  };

  // Handle form submission
  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('hashtags', hashtags);
    formData.append('content', content);
    if (thumbnail) {
      formData.append('thumbnail', thumbnail);
    }

    try {
      const response = await fetch('/api/blog/create', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (response.ok) {
        console.log('Post created:', result);
        // Optionally clear the form or redirect
      } else {
        console.error('Failed to create post:', result);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className='p-10'>
      <div>
        <input 
          type="text" 
          placeholder='Title' 
          className='p-2 w-full mb-4 border rounded'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      
      <div>
        <input 
          type="text" 
          placeholder='#hashtags' 
          className='p-2 w-full mb-4 border rounded'
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
        />
      </div>

      <div>
        <input 
          type="file" 
          accept="image/*"
          className='p-2 w-full mb-4 border rounded'
          onChange={handleFileChange}
          placeholder='Add a thumbnail'
        />
      </div>

      <div className="mb-4">
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          modules={modules}
        />
      </div>
      
      <button 
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleSubmit}
      >
        Publish
      </button>
    </div>
  );
};

export default Page;
