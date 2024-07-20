// DARK MODE TOGGLE LOGICS
let darkmode = localStorage.getItem("darkmode");

const darkmode_toggler = document.querySelector('.darkmode_toggle');
const asterisk_logo = document.querySelector('.logo');

const enableDarkMode = () => {
    //1. add the class darkmode to the body
    document.body.classList.add('darkmode_theme');  // add css class
    // updating logo theme
    if (asterisk_logo) {
        asterisk_logo.src = asterisk_dark_path;
    }
    //2. update darkMode in the localstorage
    localStorage.setItem('darkmode', 'enabled');
};

const disableDarkMode = () => {
    document.body.classList.remove("darkmode_theme");
    if (asterisk_logo) {
        asterisk_logo.src = asterisk_light_path;
    }
    localStorage.removeItem('darkmode');
}

if (darkmode === 'enabled') {
    enableDarkMode();
}

if (darkmode_toggler) {
    darkmode_toggler.addEventListener('click', () => {
        darkmode = localStorage.getItem("darkmode");
        if (darkmode !== 'enabled') {
            enableDarkMode();
        } else {
            disableDarkMode()
        }
    });
}
