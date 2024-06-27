import React, { useState } from "react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Import the CSS file

function Login() {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleNameChange = (event) => {
        setName(event.target.value);
    }

    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
    }

    const loginUser = async (event) => {
        event.preventDefault();
        try {
            const response = await axios.post('https://blog-backend-khj7.onrender.com/login', 
            { username: name, userpassword: password },
            { withCredentials: true }); 

            if (response.status === 200) {
                // Make a GET request to /home to ensure the session is established
                const homeResponse = await axios.get('https://blog-backend-khj7.onrender.com/home', { withCredentials: true });
                if (homeResponse.status === 200) {
                    navigate('/home');
                }
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
                    <input type="text" onChange={handleNameChange} name="username" value={name} placeholder="Username" required />
                    <input type="password" onChange={handlePasswordChange} name="userpassword" value={password} placeholder="Password" required />
                    <button type="submit">Submit</button>
                </form>
            </div>
        </div>
    );
}

export default Login;
