// ── FUNCIONES DE CREACIÓN ────────────────────────────────────────────────────


function createLoginContainer()
{
    // 1. Construir elementos
    let divPadding = document.createElement('div');
    let divCard    = document.createElement('div');
    let divBody    = document.createElement('div');
    let divCenter  = document.createElement('div');
    let pSignIn    = document.createElement('p');
    let divUser    = document.createElement('div');
    let inputUser  = document.createElement('input');
    let divPass    = document.createElement('div');
    let inputPass  = document.createElement('input');
    let divCheck   = document.createElement('div');
    let labelCheck = document.createElement('label');
    let inputCheck = document.createElement('input');
    let spanCheck  = document.createTextNode('I AGREE WITH TERMS & CONDITIONS');
    let btnSignIn  = document.createElement('button');
    let pResult    = document.createElement('p');
    let divFooter  = document.createElement('div');
    let pFooter    = document.createElement('p');
    let spanFooter = document.createTextNode('Do not have an account? ');
    let aSignUp    = document.createElement('a');

    // 2. Asignar clases y estilos
    divPadding.classList.add('w3-padding-32');
    divCard.classList.add('w3-white', 'w3-round', 'w3-margin-bottom', 'w3-border');
    divBody.classList.add('w3-padding-large');
    divCenter.classList.add('w3-center', 'w3-padding-16');
    pSignIn.innerText = 'SIGN IN';
    divUser.classList.add('w3-margin-bottom');
    inputUser.type        = 'text';
    inputUser.id          = 'wc-login-username';
    inputUser.classList.add('w3-input', 'w3-round', 'w3-border');
    inputUser.placeholder = 'Enter Username';
    divPass.classList.add('w3-margin-bottom');
    inputPass.type        = 'password';
    inputPass.id          = 'wc-login-password';
    inputPass.classList.add('w3-input', 'w3-round', 'w3-border');
    inputPass.placeholder = 'Enter Password';
    divCheck.classList.add('w3-margin-bottom');
    inputCheck.type    = 'checkbox';
    inputCheck.id      = 'wc-login-checkbox';
    inputCheck.classList.add('w3-check');
    inputCheck.checked = true;
    labelCheck.htmlFor = 'wc-login-checkbox';
    btnSignIn.type = 'button';
    btnSignIn.id   = 'wc-login-btn';
    btnSignIn.classList.add('w3-button', 'w3-round', 'w3-margin-bottom', 'w3-primary', 'w3-block');
    btnSignIn.innerText = 'Sign In';
    pResult.id = 'wc-login-result';
    divFooter.classList.add('w3-center', 'w3-border-top');
    pFooter.classList.add('w3-margin');
    aSignUp.href      = 'register.html';
    aSignUp.innerText = 'Sign Up here';

    // 3. Ensamblar
    divCenter.appendChild(pSignIn);
    divUser.appendChild(inputUser);
    divPass.appendChild(inputPass);
    labelCheck.appendChild(inputCheck);
    labelCheck.appendChild(spanCheck);
    divCheck.appendChild(labelCheck);
    pFooter.appendChild(spanFooter);
    pFooter.appendChild(aSignUp);
    divFooter.appendChild(pFooter);
    divBody.appendChild(divCenter);
    divBody.appendChild(divUser);
    divBody.appendChild(divPass);
    divBody.appendChild(divCheck);
    divBody.appendChild(btnSignIn);
    divBody.appendChild(pResult);
    divCard.appendChild(divBody);
    divCard.appendChild(divFooter);
    divPadding.appendChild(divCard);

    return divPadding;
}

// ── WEBCOMPONENT ─────────────────────────────────────────────────────────────

class WCLoginFormView extends HTMLElement
{
    constructor()
    {
        super(); 

        // Se construyen los elementos visuales en el constructor
        this.container = createLoginContainer();
        this.btnSignIn = this.container.querySelector('#wc-login-btn');

        this.appendChild(this.container);
    }

    // Método interno que despacha el evento hacia afuera
    // El componente no conoce la lógica de red, solo notifica lo que el usuario hizo
    _despacharRequest()
    {
        const username = this.querySelector('#wc-login-username').value;
        const password = this.querySelector('#wc-login-password').value;

        if (!username || !password)
        {
            this.querySelector('#wc-login-result').innerText = 'Completá usuario y contraseña.';
            return;
        }

        // bubbles: true permite que el evento suba hasta document
        // donde el index.html lo escucha y decide qué hacer
        this.dispatchEvent(new CustomEvent('request',
        {
            bubbles: true,
            detail:  { action: 'login', username, password }
        }));
    }

    connectedCallback()
    {
        this.btnSignIn.addEventListener('click', this._despacharRequest.bind(this));
    }

    
    disconnectedCallback()
    {
        this.btnSignIn.removeEventListener('click', this._despacharRequest.bind(this));
    }
}

customElements.define('wc-login-form-view', WCLoginFormView);
