import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [submittedValues, setSubmittedValues] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await axios.get('https://blog-backend-khj7.onrender.com/home', {
                    withCredentials: true // Include credentials in the request
                });
                const data = Array.isArray(response.data) ? response.data : [];
                setSubmittedValues(data);
            } catch (error) {
                navigate('/login');
                console.error('Error fetching posts:', error);
            }
        }
        fetchData();
    }, [navigate]);

    function handleTitleChange(event) {
        setTitle(event.target.value);
    }

    function handleContentChange(event) {
        setContent(event.target.value);
    }

    async function postBlog(event) {
        event.preventDefault();
        try {
            await axios.post('https://blog-backend-khj7.onrender.com/postblog', 
            { postTitle: title, postContent: content }, 
            { withCredentials: true }); // Include credentials
            const newBlogPost = { post_title: title, post_content: content };
            setSubmittedValues([...submittedValues, newBlogPost]);
        } catch (error) {
            console.error('There was an error in posting user blog post', error);
        }
        setTitle("");
        setContent("");
    }
    
    async function showPost(postTitle) {
        try {
            const response = await axios.post('https://blog-backend-khj7.onrender.com/post', 
            { postTitle }, 
            { withCredentials: true }); // Include credentials
            if (response.status === 200) {
                navigate('/post', { state: { post: response.data.post } });
            } else {
                console.error('Error fetching post');
            }
        } catch (error) {
            console.error('There was an error fetching the post', error);
        }
    }
    

    return (
        <div className="home-parent">
            <div className="blog-box">
                <form onSubmit={postBlog} className="blog-form">
                    <textarea type="text" onChange={handleTitleChange} value={title} placeholder="Title" className="blog-title"/>
                    <textarea onChange={handleContentChange} value={content} placeholder="Write your experience..." className="blog-content" />
                    <button>Publish</button>
                </form>
                <div className="blog-post-title">
                    <h1 className="community-posts">Community posts</h1>
                    <ul>
                        {submittedValues.map((blogpost, index) => (
                            <li key={index} onClick={() => showPost(blogpost.post_title)}>
                                {blogpost.post_title}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default Home;
