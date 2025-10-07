import {
    LOGIN_CONFIRMED_ACTION,
    LOGOUT_ACTION,
    SIGNUP_CONFIRMED_ACTION,
    VERIFICATION_CONFIRMED_ACTION,
    CLEAR_AUTH_MESSAGES,
} from '../actions/AuthActions';

const initialState = {
    user: null,           // Changed from token-based auth details to a single user object
    errorMessage: '',
    successMessage: '',
    showLoading: false,
};

export function AuthReducer(state = initialState, action) {
    if (action.type === SIGNUP_CONFIRMED_ACTION) {
        return {
            ...state,
            user: null,  // Don't set user as authenticated after registration
            errorMessage: '',
            successMessage: 'Registration successful! Please verify your email.',
            showLoading: false,
        };
    }
    if (action.type === LOGIN_CONFIRMED_ACTION) {
        return {
            ...state,
            user: action.payload,  // Store the user object upon successful login
            errorMessage: '',
            successMessage: 'Login Successfully Completed',
            showLoading: false,
        };
    }
    if (action.type === VERIFICATION_CONFIRMED_ACTION) {
        return {
            ...state,
            user: action.payload,  // Set user as authenticated after verification
            errorMessage: '',
            successMessage: 'Email verified successfully!',
            showLoading: false,
        };
    }
    if (action.type === LOGOUT_ACTION) {
        return {
            isAuthenticated: false, // Reset authentication state
            user: null, // Ensure user data is cleared
            errorMessage: '',
            successMessage: '',
        };
    }
    if (action.type === CLEAR_AUTH_MESSAGES) {
        return {
            ...state,
            errorMessage: '',
            successMessage: '',
            showLoading: false,
        };
    }
    return state;
}
