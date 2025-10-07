import { lazy, Suspense, useEffect } from 'react';

/// Components
import { connect, useDispatch } from 'react-redux';
import {  Route, Switch,Redirect, withRouter } from 'react-router-dom';
// action
import { checkAutoLogin, startActivityMonitoring, startPeriodicSessionCheck } from './store/actions/AuthActions';
import { isAuthenticated } from './store/selectors/AuthSelectors';
/// Style
import "./vendor/bootstrap-select/dist/css/bootstrap-select.min.css";
import "./css/style.css";
import "./jsx/index.css";

const Home=lazy(() => import('./jsx/pages/Home'));
const SignUp = lazy(() => import('./jsx/pages/Registration'));
const ForgotPassword = lazy(() => import('./jsx/pages/ForgotPassword'));
const ResetCode = lazy(() => import('./jsx/pages/ResetCode'));
const VerificationCode = lazy(() => import('./jsx/pages/VerificationCode'));
const Login = lazy(() => {
    return new Promise(resolve => {
    setTimeout(() => resolve(import('./jsx/pages/Login')), 500);
  });
});
const Dashboard = lazy(() => import('./jsx/pages/Dashboard'));


function App(props) {
    const dispatch = useDispatch();

    useEffect(() => {
        checkAutoLogin(dispatch, props.history);

        // Prevent back button navigation after login/logout
        window.history.pushState(null, null, window.location.href);
        window.addEventListener("popstate", function (event) {
        window.history.pushState(null, null, window.location.href);
        });
    }, [dispatch]); // Remove props.history from dependencies
    
    // Start activity monitoring and periodic session check when authenticated
    useEffect(() => {
        if (props.isAuthenticated && props.user) {
            console.log('User authenticated, starting activity monitoring and session check...');
            
            // Start activity monitoring
            const activityCleanup = startActivityMonitoring(dispatch, props.history);
            
            // Start periodic session check
            const sessionCheckInterval = startPeriodicSessionCheck(dispatch);
            window.sessionCheckInterval = sessionCheckInterval;
            
            return () => {
                // Cleanup both on unmount
                if (activityCleanup) activityCleanup();
                if (sessionCheckInterval) clearInterval(sessionCheckInterval);
                window.sessionCheckInterval = null;
            };
        }
    }, [props.isAuthenticated, props.user, dispatch]); // Remove props.history from dependencies
    
    let routes = (  
        <Switch>
            <Redirect exact from="/" to="/home" />
            <Route path='/home' component={Home} />      
            <Route path='/login' component={Login} />
            <Route path='/register' component={SignUp} />
            <Route path='/verification' component={VerificationCode} />
            <Route path='/forgot-password' component={ForgotPassword} />
            <Route path='/reset-code' component={ResetCode} />
            
            {/* Single route that catches ALL dashboard/module routes */}
            <Route path='/*' component={Dashboard} />
        </Switch>
    );
    
    // If user is authenticated, redirect public routes to dashboard
    if (props.isAuthenticated) {
        // Check if current path is a public route that should redirect to dashboard
        const publicRoutes = ['/login', '/register', '/verification', '/forgot-password', '/reset-code'];
        const currentPath = window.location.pathname;
        
        if (publicRoutes.includes(currentPath)) {
            // Redirect to dashboard if trying to access public routes while logged in
            // Use history.replace to change the URL without adding to browser history
            props.history.replace('/dashboard');
            return null; // Return null to prevent rendering while redirecting
        }
    }
    
    return (
        <div className="vh-100">
            <Suspense fallback={
                <div id="preloader">
                    <div className="sk-three-bounce">
                        <div className="sk-child sk-bounce1"></div>
                        <div className="sk-child sk-bounce2"></div>
                        <div className="sk-child sk-bounce3"></div>
                    </div>
                </div>  
            }>
                {routes}
            </Suspense>
        </div>
    );
}

const mapStateToProps = (state) => {
    return {
        isAuthenticated: isAuthenticated(state),
    };
};

export default withRouter(connect(mapStateToProps)(App)); 


