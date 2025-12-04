from email_validator import validate_email, EmailNotValidError


def is_valid_email(email: str) -> bool:
    """
    Validate email format
    
    Args:
        email: Email address to validate
        
    Returns:
        True if valid, False otherwise
    """
    try:
        validate_email(email)
        return True
    except EmailNotValidError:
        return False


def is_strong_password(password: str, min_length: int = 8) -> bool:
    """
    Validate password strength
    
    Args:
        password: Password to validate
        min_length: Minimum password length (default: 8)
        
    Returns:
        True if password is strong enough, False otherwise
    """
    return len(password) >= min_length
