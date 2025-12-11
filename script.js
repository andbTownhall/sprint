// ===============================
// Validate Polish phone numbers
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

// ===============================
// Validate PESEL
// ===============================
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

// ===============================
// REQUEST FORM VALIDATION
// ===============================
const requestForm = document.getElementById("requestForm");

if (requestForm) {
    requestForm.addEventListener("submit", function (e) {
        e.preventDefault();

        let valid = true;

        function showError(id, msg) {
            const el = document.getElementById(id);
            el.textContent = msg;
            el.style.display = "block";
        }

        function hideError(id) {
            const el = document.getElementById(id);
            el.style.display = "none";
        }

        // NAME + SURNAME (CAPITALS)
        const name = document.getElementById("name").value.trim();
        const middleName = document.getElementById("middleName").value.trim();
        const surname = document.getElementById("surname").value.trim();

        const capitalPattern = /^[A-ZĄĆĘŁŃÓŚŻŹ]+$/;

        if (!name) {
            showError("nameError", "This field is required.");
            valid = false;
        } else if (!capitalPattern.test(name)) {
            showError("nameError", "Use ONLY CAPITAL LETTERS.");
            valid = false;
        } else hideError("nameError");

        if (middleName && !capitalPattern.test(middleName)) {
            showError("middleNameError", "Use ONLY CAPITAL LETTERS.");
            valid = false;
        } else hideError("middleNameError");

        if (!surname) {
            showError("surnameError", "This field is required.");
            valid = false;
        } else if (!capitalPattern.test(surname)) {
            showError("surnameError", "Use ONLY CAPITAL LETTERS.");
            valid = false;
        } else hideError("surnameError");

        // PESEL
        const pesel = document.getElementById("pesel").value.trim();
        if (!pesel) {
            showError("peselError", "This field is required.");
            valid = false;
        } else if (!isValidPESEL(pesel)) {
            showError("peselError", "Invalid PESEL.");
            valid = false;
        } else hideError("peselError");

        // PHONE OR EMAIL
        const phoneVal = document.getElementById("phone").value.trim();
        const emailVal = document.getElementById("email").value.trim();

        if (phoneVal && !isValidPolishPhone(phoneVal)) {
            showError("phoneError", "Invalid Polish phone number.");
            valid = false;
        } else hideError("phoneError");

        if (emailVal) {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(emailVal)) {
                showError("emailError", "Invalid email.");
                valid = false;
            } else hideError("emailError");
        } else hideError("emailError");

        if (!phoneVal && !emailVal) {
            showError("phoneError", "Provide at least phone or email.");
            showError("emailError", "Provide at least phone or email.");
            valid = false;
        }

        // REQUEST TYPE
        const selectedType = document.querySelector("input[name='requestType']:checked");
        if (!selectedType) {
            document.getElementById("typeError").style.display = "block";
            valid = false;
        } else document.getElementById("typeError").style.display = "none";

        // SUBTYPE
        const selectedSub = document.querySelector("input[name='subType']:checked");
        if (selectedType && !selectedSub) {
            document.getElementById("subError").style.display = "block";
            valid = false;
        } else document.getElementById("subError").style.display = "none";

        if (valid) {
            document.getElementById("successMessage").style.display = "block";
            this.reset();
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

        function showError(id, msg) {
            const el = document.getElementById(id);
            el.textContent = msg;
            el.style.display = "block";
        }

        function hideError(id) {
            const el = document.getElementById(id);
            el.style.display = "none";
        }
        // NAME + SURNAME (CAPITALS)
        const name = document.getElementById("name").value.trim();
        const middleName = document.getElementById("middleName").value.trim();
        const surname = document.getElementById("surname").value.trim();

        const capitalPattern = /^[A-ZĄĆĘŁŃÓŚŻŹ]+$/;

        if (!name) {
            showError("nameError", "This field is required.");
            valid = false;
        } else if (!capitalPattern.test(name)) {
            showError("nameError", "Use ONLY CAPITAL LETTERS.");
            valid = false;
        } else hideError("nameError");

        if (middleName && !capitalPattern.test(middleName)) {
            showError("middleNameError", "Use ONLY CAPITAL LETTERS.");
            valid = false;
        } else hideError("middleNameError");

        if (!surname) {
            showError("surnameError", "This field is required.");
            valid = false;
        } else if (!capitalPattern.test(surname)) {
            showError("surnameError", "Use ONLY CAPITAL LETTERS.");
            valid = false;
        } else hideError("surnameError");

        // PESEL
        const pesel = document.getElementById("pesel").value.trim();
        if (!pesel) {
            showError("peselError", "This field is required.");
            valid = false;
        } else if (!isValidPESEL(pesel)) {
            showError("peselError", "Invalid PESEL.");
            valid = false;
        } else hideError("peselError");

        // PHONE OR EMAIL
        const phoneVal = document.getElementById("phone").value.trim();
        const emailVal = document.getElementById("email").value.trim();

        if (phoneVal && !isValidPolishPhone(phoneVal)) {
            showError("phoneError", "Invalid Polish phone number.");
            valid = false;
        } else hideError("phoneError");

        if (emailVal) {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(emailVal)) {
                showError("emailError", "Invalid email.");
                valid = false;
            } else hideError("emailError");
        } else hideError("emailError");

        // PASSWORD VALIDATION
        const password = document.getElementById("password").value.trim();
        const confirmPassword = document.getElementById("confirmPassword").value.trim();

        const strongPasswordPattern =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

        if (!password) {
            showError("passwordError", "This field is required.");
            valid = false;
        } else if (!strongPasswordPattern.test(password)) {
            showError(
                "passwordError",
                "Password must be 8+ chars, include upper/lowercase, a digit and a symbol."
            );
            valid = false;
        } else hideError("passwordError");

        if (!confirmPassword) {
            showError("confirmPasswordError", "This field is required.");
            valid = false;
        } else if (password !== confirmPassword) {
            showError("confirmPasswordError", "Passwords do not match.");
            valid = false;
        } else hideError("confirmPasswordError");

        if (valid) {
            document.getElementById("registerSuccess").style.display = "block";
            this.reset();
        }
    });
}
