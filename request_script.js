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
    general: [
        "Opening hours",
        "Fees",
        "Contact",
        "Other"
    ],
    id: [
        "Lost ID",
        "Damaged ID",
        "Expired ID/Renewal",
        "Change of details",
        "First-time application",
        "Other"
    ],
    passport: [
        "Lost passport",
        "Expired passport/Renewal",
        "Change of details",
        "First-time application",
        "Other"
    ],
    trp: [
        "Application",
        "Extension",
        "Change of status",
        "Other"
    ]
};

// DOM references
const subGroup = document.getElementById("subGroup");
const subOptions = document.getElementById("subOptions");
const subLegend = document.getElementById("subLegend");

// Listen for request type changes
document.querySelectorAll("input[name='requestType']").forEach(radio => {
    radio.addEventListener("change", function () {

        const key = this.value;

        // Human-friendly display names for the parent category
        const typeDisplayNames = {
            general: "General Inquiry",
            id: "ID",
            passport: "Passport",
            trp: "Temporary Residence Permit"
        };

        const displayName = typeDisplayNames[key] || key;

        // Clear previous options
        subOptions.innerHTML = "";

        // Populate new options
        subcategories[key].forEach(option => {
            const label = document.createElement("label");

            label.innerHTML = `
                <input type="radio" name="subType" value="${option}">
                ${option}
            `;

            subOptions.appendChild(label);
        });

        // Show the group box and set the legend to include the parent category
        subGroup.style.display = "block";
        // e.g. "General Inquiry — Subcategory"
        subLegend.textContent = "Subcategory";

        // Add a parent-specific class to allow styling based on parent type
        // remove any previous parent-... classes first
        subGroup.classList.forEach(cls => {
            if (cls.startsWith('parent-')) subGroup.classList.remove(cls);
        });
        subGroup.classList.add(`parent-${key}`);
    });
});



// ===============================
// MAIN FORM HANDLER
// ===============================
document.getElementById("requestForm").addEventListener("submit", function (e) {
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

    // -------------------------------------------------
    // NAME & SURNAME (ONLY CAPITAL LETTERS + accented)
    // -------------------------------------------------
    const name = document.getElementById("name").value.trim();
    const surname = document.getElementById("surname").value.trim();

    // Capital Latin + accented capitals
    // Includes Polish capital letters
    const capitalPattern = /^[A-ZĄĆĘŁŃÓŚŻŹ]+$/;

    if (!name) {
        showError("nameError", "This field is required.");
        valid = false;
    } else if (!capitalPattern.test(name)) {
        showError("nameError", "Use ONLY CAPITAL LETTERS (A–Z, Ą, Ć, Ę, Ł, Ń, Ó, Ś, Ż, Ź).");
        valid = false;
    } else {
        hideError("nameError");
    }

    if (!surname) {
        showError("surnameError", "This field is required.");
        valid = false;
    } else if (!capitalPattern.test(surname)) {
        showError("surnameError", "Use ONLY CAPITAL LETTERS (A–Z, Ą, Ć, Ę, Ł, Ń, Ó, Ś, Ż, Ź).");
        valid = false;
    } else {
        hideError("surnameError");
    }



    // --------------------------
    // PESEL VALIDATION
    // --------------------------
    const pesel = document.getElementById("pesel").value.trim();
    const peselError = document.getElementById("peselError");

    if (!pesel) {
        showError("peselError", "This field is required.");
        valid = false;
    } else if (!isValidPESEL(pesel)) {
        showError("peselError", "Invalid PESEL number.");
        valid = false;
    } else {
        hideError("peselError");
    }


    // --------------------------
    // PHONE OR EMAIL REQUIRED
    // --------------------------
    const phoneVal = document.getElementById("phone").value.trim();
    const emailVal = document.getElementById("email").value.trim();

    const phoneError = document.getElementById("phoneError");
    const emailError = document.getElementById("emailError");

    // phone validation only if filled
    if (phoneVal && !isValidPolishPhone(phoneVal)) {
        showError("phoneError", "Invalid Polish phone number.");
        valid = false;
    } else {
        hideError("phoneError");
    }

    // email validation only if filled
    if (emailVal) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(emailVal)) {
            showError("emailError", "Invalid email address.");
            valid = false;
        } else {
            hideError("emailError");
        }
    } else {
        hideError("emailError");
    }

    // at least one of phone or email must exist
    if (!phoneVal && !emailVal) {
        showError("phoneError", "Provide at least phone or email.");
        showError("emailError", "Provide at least phone or email.");
        valid = false;
    }


    // --------------------------
    // REQUEST TYPE VALIDATION
    // --------------------------
    const selectedType = document.querySelector("input[name='requestType']:checked");
    const typeError = document.getElementById("typeError");

    if (!selectedType) {
        typeError.style.display = "block";
        valid = false;
    } else {
        typeError.style.display = "none";
    }

    // --------------------------
    // SUBCATEGORY VALIDATION
    // --------------------------
    const selectedSub = document.querySelector("input[name='subType']:checked");
    const subError = document.getElementById("subError");

    if (selectedType && !selectedSub) {
        subError.style.display = "block";
        valid = false;
    } else {
        subError.style.display = "none";
    }



    // --------------------------
    // SUCCESS
    // --------------------------
    if (valid) {
        document.getElementById("successMessage").style.display = "block";
        this.reset();
    }
});
