import React, { useState } from "react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Import the CSS file

function Login() {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    function handleNameChange(event) {
        setName(event.target.value);
    }

    function handlePasswordChange(event) {
        setPassword(event.target.value);
    }

    async function loginUser(event) {
        event.preventDefault();
        try {
            const response = await axios.post('https://blog-backend-khj7.onrender.com/login', 
            { username: name, userpassword: password },
            { withCredentials: true }); // Include credentials
            if (response.status === 200) {
                navigate('/home');
            }
        } catch (error) {
            if (error.response) {
                if (error.response.status === 400 || error.response.status === 401) {
                    alert("Invalid username or password");
                } else {
                    console.error('Error logging in user:', error);
                    alert("There was an error logging in the user");
                }
            } else {
                console.error('Error logging in user:', error);
                alert("There was an error logging in the user");
            }
        }
    }
    
    return (
        <div className="login-background">
            <div className="login-container">
                <h1>Login</h1>
                <form onSubmit={loginUser}>
                    <input type="text" onChange={handleNameChange} name="username" value={name} placeholder="Username" />
                    <input type="password" onChange={handlePasswordChange} name="userpassword" value={password} placeholder="Password" />
                    <button type="submit">Submit</button>
                </form>
            </div>
        </div>
    );
}

export default Login;
