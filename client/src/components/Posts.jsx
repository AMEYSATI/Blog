import React from 'react';
import { useLocation } from 'react-router-dom';
import './Posts.css'; // Import the CSS file

function Posts() {
    const location = useLocation();
    const { post } = location.state || {};

    if (!post) {
        return <div className="posts-container">No post to display</div>;
    }

    return (
        <div className='posts-parent'>
        <div className="posts-container">
            <h1>{post.post_title}</h1>
            <p>{post.post_content}</p>
        </div>
        </div>
    );
}

export default Posts;
