// ===============================
// UTILITY AND VALIDATION FUNCTIONS
// ===============================
function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = msg;
        el.style.display = "block";
    }
}

function hideError(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = "none";
    }
}

function isValidPolishPhone(phone) {
    if (!phone) return false;
    const s = phone.trim();
    const digits = s.replace(/\D/g, '');
    if (s.startsWith('+')) {
        if (!digits.startsWith('48')) return false;
        return (digits.length - 2) === 9;
    }
    if (digits.startsWith('48')) {
        return (digits.length - 2) === 9;
    }
    return digits.length === 9;
}

function isValidPESEL(p) {
    if (!/^\d{11}$/.test(p)) return false;
    const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
    let sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(p[i]) * weights[i];
    }
    const control = (10 - (sum % 10)) % 10;
    return control === parseInt(p[10]);
}

function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

function validateName(id, errorId, fieldName, isRequired = true) {
    const value = document.getElementById(id).value.trim();
    const capitalPattern = /^[A-ZĄĆĘŁŃÓŚŻŹ]+$/;

    if (!value && isRequired) {
        showError(errorId, "This field is required.");
        return false;
    } else if (value && !capitalPattern.test(value)) {
        showError(errorId, "Use ONLY CAPITAL LETTERS.");
        return false;
    }
    hideError(errorId);
    return true;
}

function validatePESEL(id, errorId) {
    const value = document.getElementById(id).value.trim();
    
    if (!value) {
        showError(errorId, "This field is required.");
        return false;
    } else if (!isValidPESEL(value)) {
        showError(errorId, "Invalid PESEL.");
        return false;
    }
    hideError(errorId);
    return true;
}

function validatePhone(id, errorId, isRequired = false) {
    const value = document.getElementById(id).value.trim();
    
    if (!value && isRequired) {
        showError(errorId, "This field is required.");
        return false;
    } else if (value && !isValidPolishPhone(value)) {
        showError(errorId, "Invalid Polish phone number.");
        return false;
    }
    hideError(errorId);
    return true;
}

function validateEmailField(id, errorId, isRequired = true) {
    const value = document.getElementById(id).value.trim();
    
    if (!value && isRequired) {
        showError(errorId, "This field is required.");
        return false;
    } else if (value && !isValidEmail(value)) {
        showError(errorId, "Invalid email.");
        return false;
    }
    hideError(errorId);
    return true;
}

// ===============================
// SUBCATEGORY DEFINITIONS
// ===============================
const subcategories = {
    general: ["Opening hours", "Fees", "Contact", "Other"],
    id: ["Lost ID", "Damaged ID", "Expired ID/Renewal", "Change of details", "First-time application", "Other"],
    passport: ["Lost passport", "Expired passport/Renewal", "Change of details", "First-time application", "Other"],
    trp: ["Application", "Extension", "Change of status", "Other"]
};

const subGroup = document.getElementById("subGroup");
const subOptions = document.getElementById("subOptions");
const subLegend = document.getElementById("subLegend");

// ===============================
// Request Type → Subcategory Logic
// ===============================
if (subGroup && subOptions) {
    document.querySelectorAll("input[name='requestType']").forEach(radio => {
        radio.addEventListener("change", function () {
            const key = this.value;

            // Clear previous
            subOptions.innerHTML = "";

            // Add options
            subcategories[key].forEach(option => {
                const label = document.createElement("label");
                label.innerHTML = `
                    <input type="radio" name="subType" value="${option}">
                    ${option}
                `;
                subOptions.appendChild(label);
            });

            subGroup.style.display = "block";
            subLegend.textContent = "Subcategory";

            // remove previous class
            subGroup.classList.forEach(cls => {
                if (cls.startsWith("parent-")) subGroup.classList.remove(cls);
            });
            subGroup.classList.add(`parent-${key}`);
        });
    });
}

// ===============================
// GUEST REQUEST SUBMISSION
// ===============================
const requestForm = document.getElementById("requestForm");

if (requestForm) {
    const storedUser = localStorage.getItem("userProfile");
    if (storedUser) {
        const user = JSON.parse(storedUser);
        
        //FILL IF EXISTS
        if (document.getElementById("name")) document.getElementById("name").value = user.first_name || "";
        if (document.getElementById("middleName")) document.getElementById("middleName").value = user.middle_name || "";
        if (document.getElementById("surname")) document.getElementById("surname").value = user.last_name || "";
        if (document.getElementById("pesel")) document.getElementById("pesel").value = user.pesel || "";
        if (document.getElementById("phone")) document.getElementById("phone").value = user.phone_number || "";
        if (document.getElementById("email")) document.getElementById("email").value = user.email || "";

    }

    requestForm.addEventListener("submit", function (e) {
        e.preventDefault();

        let valid = true;

        //validate
        if (!validateName("name", "nameError", "Name", true)) valid = false;
        if (!validateName("middleName", "middleNameError", "Middle Name", false)) valid = false;
        if (!validateName("surname", "surnameError", "Surname", true)) valid = false;
        if (!validatePESEL("pesel", "peselError")) valid = false;
        if (!validatePhone("phone", "phoneError", false)) valid = false;
        if (!validateEmailField("email", "emailError", true)) valid = false;

        const selectedType = document.querySelector("input[name='requestType']:checked");
        if (!selectedType) {
            document.getElementById("typeError").style.display = "block";
            valid = false;
        } else {
            document.getElementById("typeError").style.display = "none";
        }

        const selectedSub = document.querySelector("input[name='subType']:checked");
        if (selectedType && !selectedSub) {
            document.getElementById("subError").style.display = "block";
            valid = false;
        } else {
            document.getElementById("subError").style.display = "none";
        }

        if (valid) {
            //prepare data (Send EVERYTHING)
            const formData = {
                name: document.getElementById("name").value.trim(),
                middleName: document.getElementById("middleName").value.trim(),
                surname: document.getElementById("surname").value.trim(),
                pesel: document.getElementById("pesel").value.trim(),
                phone: document.getElementById("phone").value.trim(),
                email: document.getElementById("email").value.trim(),
                requestType: selectedType.value,
                subcategory: selectedSub ? selectedSub.value : null,
                description: document.getElementById("description").value.trim()
            };

            //send to the endpoint (render)
            fetch('https://townhall-backend-jbj3.onrender.com/submit-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.getElementById("requestId").textContent = data.requestId;
                    const successMsg = document.getElementById("submitSuccess");
                    successMsg.style.display = "block";
                    successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    setTimeout(() => {
                        this.reset();
                        successMsg.style.display = "none";
                        if (subGroup) subGroup.style.display = "none";
                    }, 10000);
                } else {
                    alert("Error submitting request: " + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert("Could not connect to the backend server.");
            });
        }
    });
}

// ===============================
// REGISTRATION FORM VALIDATION (GUEST UPGRADE LOGIC)
// ===============================
const registrationForm = document.getElementById("registrationForm");

if (registrationForm) {
    registrationForm.addEventListener("submit", function (e) {
        e.preventDefault();

        let valid = true;

        // Run aLL validations
        if (!validateName("name", "nameError", "Name", true)) valid = false;
        if (!validateName("middleName", "middleNameError", "Middle Name", false)) valid = false;
        if (!validateName("surname", "surnameError", "Surname", true)) valid = false;
        if (!validatePESEL("pesel", "peselError")) valid = false;
        if (!validatePhone("phone", "phoneError", false)) valid = false;
        if (!validateEmailField("email", "emailError", true)) valid = false;

        // PASSWORD VALIDATION
        const password = document.getElementById("password").value.trim();
        const confirmPassword = document.getElementById("confirmPassword").value.trim();
        const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

        if (!password) {
            showError("passwordError", "This field is required.");
            valid = false;
        } else if (!strongPasswordPattern.test(password)) {
            showError(
                "passwordError",
                "Password must be 8+ chars, include upper/lowercase, a digit and a symbol."
            );
            valid = false;
        } else {
            hideError("passwordError");
        }

        if (!confirmPassword) {
            showError("confirmPasswordError", "This field is required.");
            valid = false;
        } else if (password !== confirmPassword) {
            showError("confirmPasswordError", "Passwords do not match.");
            valid = false;
        } else {
            hideError("confirmPasswordError");
        }
        
        if (valid) {
            // 1. Prepare the data
            const formData = {
                name: document.getElementById("name").value.trim(),
                middleName: document.getElementById("middleName").value.trim(),
                surname: document.getElementById("surname").value.trim(),
                pesel: document.getElementById("pesel").value.trim(),
                phone: document.getElementById("phone").value.trim(),
                email: document.getElementById("email").value.trim(),
                password: document.getElementById("password").value.trim()
            };

            // 2. Send to Server (Backend handles Create NEW or Upgrade GUEST)
            fetch('https://townhall-backend-jbj3.onrender.com/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.message.includes('successfully!')) {
                    // SHOW SUCCESS ONLY IF SERVER SAYS YES
                    const successMsg = document.getElementById("registerSuccess");
                    successMsg.textContent = data.message; // Use dynamic message from server
                    successMsg.style.display = "block";
                    successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    setTimeout(() => {
                        document.getElementById("registrationForm").reset(); // Reset form
                        successMsg.style.display = "none";
                    }, 5000);
                } else {
                    // Show server error (e.g., "User already exists!")
                    alert("Registration failed: " + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert("Could not connect to the backend server.");
            });
        }
    });
}

// ===============================
// LOGIN FORM (Now connects to Backend)
// ===============================
const loginForm = document.getElementById("login");

if (loginForm) {
    loginForm.addEventListener("submit", function(e) {
        e.preventDefault();
        
        const userId = document.getElementById("userId").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!userId || !password) {
            showError("passwordError", "Please enter both email and password.");
            return;
        }

        // Fetch Login from Backend
        fetch('https://townhall-backend-jbj3.onrender.com/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, password })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // SAVE USER DATA TO STORAGE
                localStorage.setItem("userProfile", JSON.stringify(data.user));
                localStorage.setItem("loggedInUser", data.user.first_name); // For welcome msg
                
                window.location.href = "index_loggedin.html";
            } else {
                showError("passwordError", data.message);
            }
        })
        .catch(err => console.error(err));
    });
}

// ===============================
// FORGOT PASSWORD FORM VALIDATION (RETAINED FROM NEW FILES)
// ===============================
const forgotForm = document.getElementById("forgot_password");

if (forgotForm) {
    forgotForm.addEventListener("submit", function(e) {
        e.preventDefault(); 
        let valid = true;

        const emailInput = document.getElementById("email").value.trim();

        if (!validateEmailField("email", "emailError", true)) valid = false;

        if (valid) {
            // NOTE: This is client-side only and needs a backend fetch
            const successMsg = document.getElementById("forgotSuccess");
            const emailSpan = document.getElementById("forgotEmail");
            emailSpan.textContent = emailInput; 
            successMsg.style.display = "block";
        }
    });
}

// ===============================
// RESET PASSWORD FORM VALIDATION (RETAINED FROM NEW FILES)
// ===============================
const resetForm = document.getElementById("reset_password");

if (resetForm) {
    resetForm.addEventListener("submit", function(e) {
        e.preventDefault(); 
        let valid = true;

        const emailInput = document.getElementById("email").value.trim();
        const passwordInput = document.getElementById("password").value.trim();
        const confirmPasswordInput = document.getElementById("Confpassword").value.trim();

        // Validate Email
        if (!validateEmailField("email", "emailError", true)) valid = false;

        // Validate Password
        if (!passwordInput) {
            showError("passwordError", "This field is required.");
            valid = false;
        } else {
            const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
            if (!passwordPattern.test(passwordInput)) {
                showError(
                    "passwordError",
                    "Password must be 8+ chars, include upper/lowercase, a digit and a symbol."
                );
                valid = false;
            } else {
                hideError("passwordError");
            }
        }

        // Validate Confirm Password
        if (!confirmPasswordInput) {
            showError("ConfpasswordError", "This field is required.");
            valid = false;
        } else if (passwordInput !== confirmPasswordInput) {
            showError("ConfpasswordError", "Passwords do not match.");
            valid = false;
        } else {
            hideError("ConfpasswordError");
        }

        if (valid) {
            // NOTE: This is client-side only and needs a backend fetch
            const successMsg = document.getElementById("resetSuccess");
            successMsg.style.display = "block";

            setTimeout(() => {
                resetForm.reset();
                successMsg.style.display = "none";
            }, 10000);
        }
    });
}