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

//global nav
document.addEventListener("DOMContentLoaded", () => {
    const isLoggedIn = sessionStorage.getItem("loggedInUser");
    
    if (isLoggedIn) {
        //redirect
        const path = window.location.pathname;
        if (path.endsWith("index.html") || path.endsWith("/")) {
             //prevent loops
             if (!path.includes("index_loggedin.html")) {
                 window.location.href = "index_loggedin.html";
             }
        }

        //nav fix
        const homeLinks = document.querySelectorAll('a[href="index.html"]');
        homeLinks.forEach(link => {
            link.href = "index_loggedin.html";
        });

        //logout fix
        const loginLinks = document.querySelectorAll('a[href="login.html"]');
        loginLinks.forEach(link => {
            link.textContent = "Log Out";
            link.href = "#";
            link.addEventListener("click", function(e) {
                e.preventDefault();
                sessionStorage.removeItem("loggedInUser");
                sessionStorage.removeItem("userProfile");
                window.location.href = "index.html";
            });
        });
    }
});

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
    //for updated autofill
    const isLoggedIn = sessionStorage.getItem("loggedInUser"); 
    const storedUser = sessionStorage.getItem("userProfile");

    // Only fill IF we have BOTH the badge and the folder
    if (isLoggedIn && storedUser) {
        const user = JSON.parse(storedUser);
        
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
                    const email = document.getElementById("email").value.trim();
            const successMsg = document.getElementById("registerSuccess");
            const verifyLink = document.getElementById("verifyLink");

            // set verification link
            verifyLink.href = `email_confirmation.html?email=${encodeURIComponent(email)}`;

            // show success message
            successMsg.style.display = "block";
            successMsg.scrollIntoView({ behavior: "smooth", block: "center" });

    // ===============================
    // SIMULATED EMAIL WINDOW (LIKE RESET PASSWORD)
    // ===============================

            
            const fakeVerificationCode = Math.floor(100000 + Math.random() * 900000);

            sessionStorage.setItem("verificationCode", fakeVerificationCode);
            sessionStorage.setItem("verificationEmail", email);

            const emailWindow = window.open("", "_blank", "width=600,height=400");

            if (emailWindow) {
                emailWindow.document.write(`
                    <div style="font-family: sans-serif; padding: 40px; text-align: center;">
                            <h1>Townhall Email Verification</h1>
                            <p>You need to verify your email</p>
                            <div style="background: #f0f0f0; padding: 20px; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                                ${fakeVerificationCode}
                            </div>
                            <p>This code expires in 15 minutes.</p>
                            <p style="color: #666; font-size: 12px;">(This is a simulated email for the demo)</p>
                        </div>
                `);
            } else {
                alert("Please allow pop-ups to see the verification email.");
            }

            // OPTIONAL: redirect automatically after a moment
            setTimeout(() => {
                window.location.href =
                        `email_confirmation.html?email=${encodeURIComponent(email)}`;
            }, 3000);
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
// EMAIL CONFIRMATION PAGE LOGIC
// ===============================

const verifyForm = document.getElementById("email_confirmation");

if (verifyForm) {
    verifyForm.addEventListener("submit", function(e) {
        e.preventDefault();

        const inputCode = document.getElementById("resetCode").value.trim();
        const storedCode = sessionStorage.getItem("verificationCode"); // code stored when registration/email sent

        const errorDiv = document.getElementById("verifyError");
        const successDiv = document.getElementById("verifySuccess");

        // Hide messages initially
        errorDiv.style.display = "none";
        successDiv.style.display = "none";

        if (!inputCode) {
            errorDiv.textContent = "Please enter the code.";
            errorDiv.style.display = "block";
            return;
        }

        if (inputCode === storedCode) {
            // correct code
            successDiv.style.display = "block";

            // optional: clear session storage so code can't be reused
            sessionStorage.removeItem("verificationCode");
            sessionStorage.removeItem("verificationEmail");

            // optionally reset form after a while
            setTimeout(() => {
                successDiv.style.display = "none";
                verifyForm.reset();
            }, 5000);
        } else {
            // incorrect code
            errorDiv.textContent = "Invalid code. Try again.";
            errorDiv.style.display = "block";
        }
    });
}




// ===============================
// LOGIN LOCKOUT SETTINGS
// ===============================
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 10 * 60 * 1000; // 10 minutes
const loginAttempts = {}; // Stores retry counts

function startCountdown(userId, lockUntil) {
    const attempt = loginAttempts[userId];
    if (attempt.timerId) clearInterval(attempt.timerId);

    attempt.timerId = setInterval(() => {
        const now = Date.now();
        const diff = lockUntil - now;

        if (diff <= 0) {
            clearInterval(attempt.timerId);
            attempt.count = 0;
            attempt.lockUntil = null;
            showError("passwordError", "Lock expired. You can try logging in again.");
        } else {
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            showError("passwordError", `Account locked. Try again in ${minutes}m ${seconds}s`);
        }
    }, 1000);
}

// ===============================
// LOGIN (lockout + session storage)
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

        //check lockout status
        if (!loginAttempts[userId]) {
            loginAttempts[userId] = { count: 0, lockUntil: null, timerId: null };
        }
        const attempt = loginAttempts[userId];

        if (attempt.lockUntil && Date.now() < attempt.lockUntil) {
            startCountdown(userId, attempt.lockUntil);
            return; //still locked
        }

        //fetch login from backend
        fetch('https://townhall-backend-jbj3.onrender.com/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, password })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                //reset lock on success
                attempt.count = 0;
                attempt.lockUntil = null;
                if (attempt.timerId) clearInterval(attempt.timerId);

                //correct session logic
                sessionStorage.setItem("userProfile", JSON.stringify(data.user));
                sessionStorage.setItem("loggedInUser", data.user.first_name); 
                window.location.href = "index_loggedin.html";
            } else {
                //increment attempts on failure
                attempt.count++;
                if (attempt.count >= MAX_ATTEMPTS) {
                    attempt.lockUntil = Date.now() + LOCK_TIME;
                    startCountdown(userId, attempt.lockUntil);
                } else {
                    showError("passwordError", `${data.message} (Attempt ${attempt.count} of ${MAX_ATTEMPTS})`);
                }
            }
        })
        .catch(err => console.error(err));
    });
}

//forget pswd (request code)
const forgotForm = document.getElementById("forgot_password");

if (forgotForm) {
    forgotForm.addEventListener("submit", function(e) {
        e.preventDefault(); 
        const emailInput = document.getElementById("email").value.trim();

        if (!validateEmailField("email", "emailError", true)) return;

        fetch('https://townhall-backend-jbj3.onrender.com/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailInput })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                if (data.fake) {
                   //email does not exist
                   alert("If this email exists, a code has been sent.");
                } else {
                    //SIMULATE EMAIL
                    const emailWindow = window.open("", "_blank", "width=600,height=400");
                    emailWindow.document.write(`
                        <div style="font-family: sans-serif; padding: 40px; text-align: center;">
                            <h1>Townhall Password Reset</h1>
                            <p>You requested a password reset.</p>
                            <div style="background: #f0f0f0; padding: 20px; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                                ${data.debugCode}
                            </div>
                            <p>This code expires in 15 minutes.</p>
                            <p style="color: #666; font-size: 12px;">(This is a simulated email for the demo)</p>
                        </div>
                    `);

                    //redirect to reset page with email param
                    window.location.href = `reset_password.html?email=${encodeURIComponent(emailInput)}`;
                }
            }
        })
        .catch(err => console.error(err));
    });
}

//reset pswd (verify code + new psswd)
const resetForm = document.getElementById("reset_password");

if (resetForm) {
    //Autofill email from url (so user doesn't have to type it again)
    const urlParams = new URLSearchParams(window.location.search);
    const emailFromUrl = urlParams.get('email');
    if (emailFromUrl) {
        document.getElementById("email").value = emailFromUrl;
    }

    resetForm.addEventListener("submit", function(e) {
        e.preventDefault(); 
        let valid = true;

        const emailInput = document.getElementById("email").value.trim();
        const codeInput = document.getElementById("resetCode").value.trim();
        const passwordInput = document.getElementById("password").value.trim();
        const confirmPasswordInput = document.getElementById("Confpassword").value.trim();

        //validate e
        if (!validateEmailField("email", "emailError", true)) valid = false;
        
        if (!codeInput) {
            document.getElementById("codeError").style.display = "block";
            valid = false;
        } else {
            document.getElementById("codeError").style.display = "none";
        }

        //validate p
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
        if (!passwordInput) {
            showError("passwordError", "This field is required.");
            valid = false;
        } else if (!passwordPattern.test(passwordInput)) {
            showError("passwordError", "Password must be 8+ chars, include upper/lowercase, a digit and a symbol.");
            valid = false;
        } else {
            hideError("passwordError");
        }

        if (passwordInput !== confirmPasswordInput) {
            showError("ConfpasswordError", "Passwords do not match.");
            valid = false;
        } else {
            hideError("ConfpasswordError");
        }

        if (valid) {
            fetch('https://townhall-backend-jbj3.onrender.com/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: emailInput, 
                    code: codeInput, 
                    newPassword: passwordInput 
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const successMsg = document.getElementById("resetSuccess");
                    successMsg.style.display = "block";
                    // Hide form so they don't submit again
                    resetForm.style.display = "none"; 
                } else {
                    alert("Error: " + data.message);
                }
            })
            .catch(err => console.error(err));
        }
    });
}

//logout
const logoutNav = document.getElementById("logoutNav");

if (logoutNav) {
    logoutNav.addEventListener("click", function(e) {
        e.preventDefault();
        
        //clear session storage
        sessionStorage.removeItem("loggedInUser");
        sessionStorage.removeItem("userProfile");

        //redirect to homepage
        window.location.href = "index.html";
    });
}ś