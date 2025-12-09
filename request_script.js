// JavaScript for Request Submission UI
// Validate Polish phone numbers: optional country code +48 or 48, and 9 digits besides country code.
function isValidPolishPhone(phone) {
    if (!phone) return false;
    const s = phone.trim();
    // Remove all non-digit characters for counting
    const digits = s.replace(/\D/g, '');

    // If user typed a plus, ensure it's +48
    if (s.startsWith('+')) {
        if (!digits.startsWith('48')) return false;
        return (digits.length - 2)  == 9; // digits after country code
    }

    // If digits start with country code without plus
    if (digits.startsWith('48')) {
        return (digits.length - 2) == 9;
    }

    // No country code: require 9 digits
    return digits.length == 9;
}


document.getElementById("requestForm").addEventListener("submit", function (e) {
    e.preventDefault();

    let valid = true;

    function checkField(id, errorId) {
        const value = document.getElementById(id).value.trim();
        const error = document.getElementById(errorId);
        if (!value) {
            error.style.display = "block";
            valid = false;
        } else {
            error.style.display = "none";
        }
    }

    checkField("name", "nameError");
    checkField("surname", "surnameError");

    // EMAIL VALIDATION
    const emailInput = document.getElementById("email");
    const emailError = document.getElementById("emailError");
    const emailVal = emailInput ? emailInput.value.trim() : "";

    if (emailVal) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(emailVal)) {
            emailError.style.display = "block";
            valid = false;
        } else {
            emailError.style.display = "none";
        }
    } else if (emailError) {
        emailError.style.display = "none";
    }

    // PHONE NUMBER VALIDATION (Poland: optional +48 or 48 country code, 9 digits after country code)
    const phoneInput = document.getElementById("phone");
    const phoneVal = phoneInput ? phoneInput.value.trim() : "";
    const phoneError = document.getElementById("phoneError");

    if (!phoneVal) {
        // required
        if (phoneError) {
            phoneError.textContent = "This field is required.";
            phoneError.style.display = "block";
        }
        valid = false;
    } else if (!isValidPolishPhone(phoneVal)) {
        if (phoneError) {
            phoneError.textContent = "Please enter a Polish phone number — optional country code +48 or 48, and 9 digits.";
            phoneError.style.display = "block";
        }
        valid = false;
    } else if (phoneError) {
        // valid
        phoneError.style.display = "none";
        phoneError.textContent = "Please enter a valid phone number.";
    }

    const type = document.getElementById("requestType");
    const typeError = document.getElementById("typeError");
    if (!type.value) {
        typeError.style.display = "block";
        valid = false;
    } else {
        typeError.style.display = "none";
    }

    if (valid) {
        document.getElementById("successMessage").style.display = "block";
        this.reset();
    }
});
