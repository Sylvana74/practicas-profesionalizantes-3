// ── FUNCIONES DE CREACIÓN ────────────────────────────────────────────────────


function createFormRow(labelText, inputId, inputType, placeholderText)
{
    // 1. Construir
    let divRow   = document.createElement('div');
    let divLabel = document.createElement('div');
    let label    = document.createElement('label');
    let divInput = document.createElement('div');
    let input    = document.createElement('input');

    // 2. Asignar
    divRow.classList.add('w3-row', 'w3-margin-bottom');
    divLabel.classList.add('w3-col', 'l2');
    label.innerText = labelText;
    divInput.classList.add('w3-col', 'l10');
    input.type        = inputType;
    input.id          = inputId;
    input.classList.add('w3-input', 'w3-border', 'w3-round');
    input.placeholder = placeholderText;

    // 3. Ensamblar
    divLabel.appendChild(label);
    divInput.appendChild(input);
    divRow.appendChild(divLabel);
    divRow.appendChild(divInput);

    return divRow;
}

function createRegisterContainer()
{
    // 1. Construir elementos
    let divCard      = document.createElement('div');
    let header       = document.createElement('header');
    let divBody      = document.createElement('div');
    let rowName      = createFormRow('Name',             'wc-reg-name',     'text',     'Enter Your Name');
    let rowEmail     = createFormRow('Email',            'wc-reg-email',    'text',     'Enter Your Email Address');
    let rowMobile    = createFormRow('Mobile Number',    'wc-reg-mobile',   'text',     'Enter Your Mobile Number');
    let rowPass      = createFormRow('Password',         'wc-reg-password', 'password', 'Enter Password');
    let rowConfirm   = createFormRow('Confirm Password', 'wc-reg-confirm',  'password', 'Confirm Password');
    let divRowCheck  = document.createElement('div');
    let divColEmpty  = document.createElement('div');
    let divColCheck  = document.createElement('div');
    let labelCheck   = document.createElement('label');
    let inputCheck   = document.createElement('input');
    let spanCheck    = document.createTextNode(' I Agree Terms & Conditions');
    let divRowBtn    = document.createElement('div');
    let divColEmpty2 = document.createElement('div');
    let divColBtn    = document.createElement('div');
    let btnRegister  = document.createElement('button');
    let iconLock     = document.createElement('i');
    let spanBtnText  = document.createTextNode(' Register');
    let pResult      = document.createElement('p');

    // 2. Asignar clases y estilos
    divCard.classList.add('w3-white', 'w3-round', 'w3-margin-bottom', 'w3-border');
    header.classList.add('w3-padding-large', 'w3-large', 'w3-border-bottom');
    header.style.fontWeight = '500';
    header.innerText        = 'HORIZONTAL FORM';
    divBody.classList.add('w3-padding-large');
    divRowCheck.classList.add('w3-row', 'w3-margin-bottom');
    divColEmpty.classList.add('w3-col', 'l2');
    divColCheck.classList.add('w3-col', 'l10');
    inputCheck.type    = 'checkbox';
    inputCheck.classList.add('w3-check');
    inputCheck.checked = true;
    divRowBtn.classList.add('w3-row', 'w3-margin-bottom');
    divColEmpty2.classList.add('w3-col', 'l2');
    divColBtn.classList.add('w3-col', 'l10');
    btnRegister.type = 'button';
    btnRegister.id   = 'wc-reg-btn';
    btnRegister.classList.add('w3-button', 'w3-primary', 'w3-round');
    iconLock.classList.add('fa', 'fa-fw', 'fa-lock');
    pResult.id = 'wc-reg-result';

    // 3. Ensamblar
    labelCheck.appendChild(inputCheck);
    labelCheck.appendChild(spanCheck);
    divColCheck.appendChild(labelCheck);
    divRowCheck.appendChild(divColEmpty);
    divRowCheck.appendChild(divColCheck);
    btnRegister.appendChild(iconLock);
    btnRegister.appendChild(spanBtnText);
    divColBtn.appendChild(btnRegister);
    divRowBtn.appendChild(divColEmpty2);
    divRowBtn.appendChild(divColBtn);
    divBody.appendChild(rowName);
    divBody.appendChild(rowEmail);
    divBody.appendChild(rowMobile);
    divBody.appendChild(rowPass);
    divBody.appendChild(rowConfirm);
    divBody.appendChild(divRowCheck);
    divBody.appendChild(divRowBtn);
    divBody.appendChild(pResult);
    divCard.appendChild(header);
    divCard.appendChild(divBody);

    return divCard;
}

// ── WEBCOMPONENT ─────────────────────────────────────────────────────────────

class WCRegisterFormView extends HTMLElement
{
    constructor()
    {
        super();

        this.container   = createRegisterContainer();
        this.btnRegister = this.container.querySelector('#wc-reg-btn');

        this.appendChild(this.container);
    }

    _despacharRequest()
    {
        const username = this.querySelector('#wc-reg-name').value;
        const password = this.querySelector('#wc-reg-password').value;
        const confirm  = this.querySelector('#wc-reg-confirm').value;

        if (!username || !password)
        {
            this.querySelector('#wc-reg-result').innerText = 'Completá los campos requeridos.';
            return;
        }

        if (password !== confirm)
        {
            this.querySelector('#wc-reg-result').innerText = 'Las contraseñas no coinciden.';
            return;
        }

        this.dispatchEvent(new CustomEvent('request',
        {
            bubbles: true,
            detail:  { action: 'register', username, password }
        }));
    }

    connectedCallback()
    {
        this.btnRegister.addEventListener('click', this._despacharRequest.bind(this));
    }

    disconnectedCallback()
    {
        this.btnRegister.removeEventListener('click', this._despacharRequest.bind(this));
    }
}

customElements.define('wc-register-form-view', WCRegisterFormView);
