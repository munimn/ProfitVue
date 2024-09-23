import { useRef } from 'react'
import { TextField, Button, Typography, Grid, Paper, Container } from '@mui/material';

import { processJSON, processText } from './FetchRoutines'

function Login({ setJwt }) {
    function confirmLogin(jwt) {
        alert("You are logged in to your account.");
        setJwt(jwt);
        console.log(jwt)
        nameInput.current.value = "";
        passwordInput.current.value = "";
    }
    function handleLogin(user) {
        fetch('http://127.0.0.1:5000/login', {
            method: 'POST',
            body: JSON.stringify(user),
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            }
        }).then(processJSON).then(confirmLogin).catch(() => { alert("Login failed"); });
    }
    function handleNewAccount(user) {
        fetch('http://127.0.0.1:5000/register', {
            method: 'POST',
            body: JSON.stringify(user),
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            }
        }).then(processText).then(newuser).catch(() => { alert("Create new account failed") });
    }
    function newuser() {
        alert("Now Login with credentials")
        nameInput.current.value = "";
        passwordInput.current.value = "";


    }
    function handleLogout() {
        alert("You are logged out of your account.");

        setJwt('');
        nameInput.current.value = "";
        passwordInput.current.value = "";


    }

    let nameInput = useRef();
    let passwordInput = useRef();

    const loginAction = (e) => { handleLogin({ username: nameInput.current.value, password: passwordInput.current.value }); }
    const newAction = (e) => { handleNewAccount({ username: nameInput.current.value, password: passwordInput.current.value }); }
    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={6} style={{ padding: '40px' }}>
                <Grid container spacing={2} direction="column" alignItems="center">
                    <Grid item xs={12}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            Welcome to our application!
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            variant="outlined"
                            required
                            fullWidth
                            label="User Name"
                            inputRef={nameInput}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            variant="outlined"
                            required
                            fullWidth
                            label="Password"
                            type="password"
                            inputRef={passwordInput}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            onClick={loginAction}
                        >
                            Log In
                        </Button>
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={newAction}
                        >
                            New Account
                        </Button>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6" component="h2">
                            Log out of your account
                        </Typography>
                        <Button
                            fullWidth
                            variant="contained"
                            color="secondary"
                            onClick={handleLogout}
                        >
                            Log Out
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    );
}


export default Login;