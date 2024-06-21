import React, { useState } from "react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Register.css'; // Import the CSS file

function Register() {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    function handleNameChange(event) {
        setName(event.target.value);
    }

    function handlePasswordChange(event) {
        setPassword(event.target.value);
    }

    async function registerUser(event) {
        event.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/register', 
                { username: name, userpassword: password },
                { withCredentials: true } // Ensure cookies are included
            );
            if (response.status === 200) {
                navigate('/home');
            }
        } catch (error) {
            if (error.response && error.response.status === 400) {
                alert("Username already exists");
            } else {
                console.error('There was an error registering the user:', error);
            }
        }
    }

    function goToLogin() {
        navigate('/login');
    }

    return (
        <div className="register-background">
            <h1 className="register-header">Welcome to blog</h1>
            <div className="register-container">
                <h1>Register</h1>
                <form onSubmit={registerUser}>
                    <input type="text" onChange={handleNameChange} value={name} placeholder="Username" />
                    <input type="password" onChange={handlePasswordChange} value={password} placeholder="Password" />
                    <button type="submit">Submit</button>
                </form>
            </div>
            <h3>Already registered?</h3>
            <h4 onClick={goToLogin} className="blog-go-login">Login</h4>
        </div>
    );
}

export default Register;
