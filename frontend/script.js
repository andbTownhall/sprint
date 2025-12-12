// ===============================
// UTILITY FUNCTIONS
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

// ===============================
// VALIDATION FUNCTIONS
// ===============================
function isValidPolishPhone(phone) {
    if (!phone) return false;

    const s = phone.trim();
    const digits = s.replace(/\D/g, '');

    // +48...
    if (s.startsWith('+')) {
        if (!digits.startsWith('48')) return false;
        return (digits.length - 2) === 9;
    }

    // 48...
    if (digits.startsWith('48')) {
        return (digits.length - 2) === 9;
    }

    // no country code
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

// ===============================
// REUSABLE VALIDATION FUNCTIONS
// ===============================
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
// REQUEST FORM VALIDATION
// ===============================
const requestForm = document.getElementById("requestForm");

if (requestForm) {
    requestForm.addEventListener("submit", function (e) {
        e.preventDefault();

        let valid = true;

        // Validate Name
        if (!validateName("name", "nameError", "Name", true)) valid = false;

        // Validate Middle Name (optional)
        if (!validateName("middleName", "middleNameError", "Middle Name", false)) valid = false;

        // Validate Surname
        if (!validateName("surname", "surnameError", "Surname", true)) valid = false;

        // Validate PESEL
        if (!validatePESEL("pesel", "peselError")) valid = false;

        // Validate Phone (optional)
        if (!validatePhone("phone", "phoneError", false)) valid = false;

        // Validate Email (required)
        if (!validateEmailField("email", "emailError", true)) valid = false;

        // REQUEST TYPE
        const selectedType = document.querySelector("input[name='requestType']:checked");
        if (!selectedType) {
            document.getElementById("typeError").style.display = "block";
            valid = false;
        } else {
            document.getElementById("typeError").style.display = "none";
        }

        // SUBTYPE
        const selectedSub = document.querySelector("input[name='subType']:checked");
        if (selectedType && !selectedSub) {
            document.getElementById("subError").style.display = "block";
            valid = false;
        } else {
            document.getElementById("subError").style.display = "none";
        }

        if (valid) {
            // Generate unique request ID (format: REQ-YYYYMMDD-XXXXX)
            const now = new Date();
            const dateStr = now.getFullYear() + 
                           String(now.getMonth() + 1).padStart(2, '0') + 
                           String(now.getDate()).padStart(2, '0');
            const randomNum = String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0');
            const requestId = `REQ-${dateStr}-${randomNum}`;
            
            // Display request ID
            document.getElementById("requestId").textContent = requestId;
            
            const successMsg = document.getElementById("submitSuccess");
            successMsg.style.display = "block";
            
            // Scroll to success message
            successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Reset form and hide success message after 10 seconds (longer to allow user to note the ID)
            setTimeout(() => {
                this.reset();
                successMsg.style.display = "none";
                
                // Hide subcategory group
                if (subGroup) {
                    subGroup.style.display = "none";
                }
            }, 10000);
        }
    });
}

// ===============================
// REGISTRATION FORM VALIDATION
// ===============================
const registrationForm = document.getElementById("registrationForm");

if (registrationForm) {
    registrationForm.addEventListener("submit", function (e) {
        e.preventDefault();

        let valid = true;

        // Validate Name
        if (!validateName("name", "nameError", "Name", true)) valid = false;

        // Validate Middle Name (optional)
        if (!validateName("middleName", "middleNameError", "Middle Name", false)) valid = false;

        // Validate Surname
        if (!validateName("surname", "surnameError", "Surname", true)) valid = false;

        // Validate PESEL
        if (!validatePESEL("pesel", "peselError")) valid = false;

        // Validate Phone (optional)
        if (!validatePhone("phone", "phoneError", false)) valid = false;

        // Validate Email (required)
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

            // 2. Send to Server
            fetch('https://townhall-backend-jbj3.onrender.com/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.message === 'User registered successfully!') {
                    // SHOW SUCCESS ONLY IF SERVER SAYS YES
                    const successMsg = document.getElementById("registerSuccess");
                    successMsg.style.display = "block";
                    successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    setTimeout(() => {
                        document.getElementById("registrationForm").reset(); // Reset form
                        successMsg.style.display = "none";
                    }, 5000);
                } else {
                    // Show server error (e.g., "Email already exists")
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