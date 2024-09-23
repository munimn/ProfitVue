// import { useState } from 'react';
// import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
// import './App.css';
// import ForecastsPage from './forecasts';
// import Home from './Home';
// import Prices from './Prices';
// import AuthContext from './AuthContext';
// import Login from './Login';
// import Costs from './Costs';
// import AR from './ar';
// import Forecasts from './arapforecasts';
// import Dashboard from './dashboard';

// function App() {
//     const [jwt, setJwt] = useState('');

//     const handleSetJwt = (token) => {
//         setJwt(token);
//     };

//     return (
//         <>
//             <AuthContext.Provider value={jwt}>
//                 <BrowserRouter>
//                     <nav>
//                         <Link className='navBarLink' to="/">Login</Link>{' '}
//                         <Link className='navBarLink' to="/Dashboard">Dashboard</Link>{' '}
//                         <Link className='navBarLink' to="/Home">Sales</Link>{' '}
//                         <Link className='navBarLink' to="/forecasts">Sales Forecasts</Link>{' '}
//                         <Link className='navBarLink' to="/Prices">Unit Prices</Link>{' '}
//                         <Link className='navBarLink' to="/ar">Total Sales(AR)</Link>{' '}
//                         <Link className='navBarLink' to="/Costs">Costs(AP)</Link>{' '}
//                         <Link className='navBarLink' to="/arapforecasts">AR AP Forecast </Link>{' '}
//                     </nav>
//                     <Routes>
//                         <Route path="/" element={<Login setJwt={handleSetJwt} />} />
//                         <Route path="/Dashboard" element={jwt ? <Dashboard /> : <Navigate replace to="/" />} />
//                         <Route path="/Home" element={jwt ? <Home /> : <Navigate replace to="/" />} />
//                         <Route path="/forecasts" element={jwt ? <ForecastsPage /> : <Navigate replace to="/" />} />
//                         <Route path="/Prices" element={jwt ? <Prices /> : <Navigate replace to="/" />} />
//                         <Route path="/ar" element={jwt ? <AR /> : <Navigate replace to="/" />} />
//                         <Route path="/Costs" element={jwt ? <Costs /> : <Navigate replace to="/" />} />
//                         <Route path="/arapforecasts" element={jwt ? <Forecasts /> : <Navigate replace to="/" />} />
//                     </Routes>
//                 </BrowserRouter>
//             </AuthContext.Provider>
//         </>
//     );
// }

// export default App;
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container, Link } from '@mui/material';
import './App.css';
import ForecastsPage from './forecasts';
import Home from './Home';
import Prices from './Prices';
import AuthContext from './AuthContext';
import Login from './Login';
import Costs from './Costs';
import AR from './ar';
import Forecasts from './arapforecasts';
import Dashboard from './dashboard';

function App() {
    const [jwt, setJwt] = useState('');

    const handleSetJwt = (token) => {
        setJwt(token);
    };

    return (
        <AuthContext.Provider value={jwt}>
            <BrowserRouter>
                <AppBar position="static">
                    <Toolbar>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            ProfitVue
                        </Typography>
                        <Button color="inherit" component={RouterLink} to="/">Login</Button>
                        <Button color="inherit" component={RouterLink} to="/Dashboard">Dashboard</Button>
                        <Button color="inherit" component={RouterLink} to="/Home">Sales</Button>
                        <Button color="inherit" component={RouterLink} to="/forecasts">Sales Forecasts</Button>
                        <Button color="inherit" component={RouterLink} to="/Prices">Unit Prices</Button>
                        <Button color="inherit" component={RouterLink} to="/ar">Total Sales(AR)</Button>
                        <Button color="inherit" component={RouterLink} to="/Costs">Costs(AP)</Button>
                        <Button color="inherit" component={RouterLink} to="/arapforecasts">AR AP Forecast</Button>
                    </Toolbar>
                </AppBar>

                <Container>
                    <Routes>
                        <Route path="/" element={<Login setJwt={handleSetJwt} />} />
                        <Route path="/Dashboard" element={jwt ? <Dashboard /> : <Navigate replace to="/" />} />
                        <Route path="/Home" element={jwt ? <Home /> : <Navigate replace to="/" />} />
                        <Route path="/forecasts" element={jwt ? <ForecastsPage /> : <Navigate replace to="/" />} />
                        <Route path="/Prices" element={jwt ? <Prices /> : <Navigate replace to="/" />} />
                        <Route path="/ar" element={jwt ? <AR /> : <Navigate replace to="/" />} />
                        <Route path="/Costs" element={jwt ? <Costs /> : <Navigate replace to="/" />} />
                        <Route path="/arapforecasts" element={jwt ? <Forecasts /> : <Navigate replace to="/" />} />
                    </Routes>
                </Container>
            </BrowserRouter>
        </AuthContext.Provider>
    );
}

export default App;
