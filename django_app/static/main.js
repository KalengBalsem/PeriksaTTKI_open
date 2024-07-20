// GLOBAL VARIABLES
const user_input = document.querySelector('.input');
const response_block = document.querySelector('.response');
const input_form = document.querySelector('.input_form');
const button_copy = document.querySelector('.button.copy');
let responseInProgress = false;

// GLOBAL FUNCTIONS
function wrapMatchedWords(text, words) {
    // Step 1: Wrap matched words with a special token: <_*_></_*_>
    for (let raw_word of words) {
        const word = raw_word.original;
        const regex = new RegExp(`\\b${word}\\b`, 'gi'); // Use word boundary and case-insensitive matching
        text = text.replace(regex, (match) => `<_*_>${match}</_*_>`);
    }
    // Step 2: Replace the special tokens with the actual HTML
    const finalRegex = /<_\*_>(.*?)<\/_\*_>/g;
    text = text.replace(finalRegex, (match, p1) => 
        `<button class="wrong" popovertarget="${p1}">${p1}</button>`
    );
    return text;
}

// set the suggestion position to be right below labelled error words
function setSuggestionPosition(event, suggestion) {
    const rect = event.target.getBoundingClientRect();
    const scrollTop = document.documentElement.scrollTop;
    const scrollLeft = document.documentElement.scrollLeft;
    const suggestionHeight = suggestion.offsetHeight;

    const top = rect.top + scrollTop + suggestionHeight + 10; // Positioning above the word with a small margin
    const left = rect.left + scrollLeft;

    suggestion.style.setProperty('top', `${top}px`);
    suggestion.style.setProperty('left', `${left}px`);
}

// get error words correction candidates
function getCorrections(originalWord, error_words) {
    for (let wordObj of error_words) {
        if (wordObj.original === originalWord) {
            return wordObj.correction;
        }
    }
    return null; // Return null if no matching original word is found
}

// copy paraphrase response logic
function copyParaphrase(htmlElement) {
    if (!htmlElement) {
        return;
    }
    let elementText = htmlElement.innerText;
    let inputElement = document.createElement('input');
    inputElement.setAttribute('value', elementText);
    document.body.appendChild(inputElement);
    inputElement.select();
    document.execCommand('copy');
    document.body.removeChild(inputElement);
} 

// SOME EPIC SHITs GOING ON HERE (send user_input and show response in the page)
input_form.addEventListener('submit', (event) => {
    event.preventDefault();
    send_user_input();
});

document.querySelector(".input").addEventListener("keypress", e => {
    if (e.key === "Enter" && !e.shiftKey) {
        if (responseInProgress) {
            e.preventDefault(); // Prevent Enter key action
        } else {
            e.preventDefault();
            send_user_input();
        }
    }
});

async function send_user_input() {
    const input = user_input.value.trim();
    if (input.length === 0) {
        return;
    }

    response_block.innerHTML = '';  // reset the response block
    
    // creating LOADING div (the algo can be optimized)
    const loader = document.createElement('p');
    loader.classList.add("loader");
    response_block.appendChild(loader);

    // disabling button temporarily
    const send_button = document.querySelector(".send_button");
    send_button.textContent = '--';
    send_button.disabled = true;

    // disabling press enter key
    responseInProgress = true;

    // hiding copy button
    button_copy.classList.add('hidden');

    // RECEIVING DYNAMIC DATA FROM DJANGO
    fetch('', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'csrfmiddlewaretoken': document.querySelector('[name=csrfmiddlewaretoken]').value,
          'data_type': 'user_input',
          'user_input': input
        })
      })
      .then(response => response.json())
      .then(data => {
        // updating credit
        // const credits_count = data.credits_count;
        // const credits_html = document.querySelector('.credits');
        // credits_html.textContent = credits_count;
        
        // accepting and assigning responses
        const typo_words = data.typo_words;
        const error_words = data.error_words;
        const rules_check = data.rules_check;
        const paraphrase = data.paraphrase;

        const typoParagraph = document.createElement('p');
        typoParagraph.classList.add('wrong_text');
        const rulesParagraph = document.createElement('p');
        const paraphraseParagraph = document.createElement('p');
        paraphraseParagraph.classList.add('paraphrase');
        typoParagraph.textContent = typo_words;
        paraphraseParagraph.textContent = paraphrase;
        
        for (const rule of rules_check) {
            const rulesSubparagraph = document.createElement('p');
            rulesSubparagraph.classList.add('rule_line');
            // Create and append rule tag span
            const ruleTag = document.createElement('span');
            ruleTag.classList.add('rule_tag');
            ruleTag.textContent = `id=${rule.rule_id}`;
            rulesSubparagraph.appendChild(ruleTag);
            // Create and append rule description to rule line paragraph
            const ruleDescription = document.createElement('span');
            ruleDescription.textContent = rule.description;
            rulesSubparagraph.appendChild(ruleDescription);
            // append rules Subparagraph to the parent Paragraph
            rulesParagraph.appendChild(rulesSubparagraph);
        }

        // create response subheadings 
        const typoSubheading = document.createElement('p');
        const paraphraseSubheading = document.createElement('p');
        typoSubheading.classList.add('sub_heading')
        paraphraseSubheading.classList.add('sub_heading')
        typoSubheading.textContent = `Typo`;
        paraphraseSubheading.textContent = `Parafrase`;

        // labelling error_words
        typoParagraph.innerHTML = wrapMatchedWords(typoParagraph.textContent, error_words);

        // append subheadings and responses
        response_block.appendChild(typoSubheading);
        response_block.appendChild(typoParagraph);

            // if rules_check is not empty, append rules
        if (rules_check.length) {
            const rulesSubheading = document.createElement('p');
            rulesSubheading.classList.add('sub_heading')
            rulesSubheading.textContent = `Kaidah`;
            response_block.appendChild(rulesSubheading);
            response_block.appendChild(rulesParagraph);
        }

        response_block.appendChild(paraphraseSubheading);
        response_block.appendChild(paraphraseParagraph);

        // remove LOADING
        loader.classList.remove("loader");

        // showing correction word suggestions
        const suggestion = document.querySelector('.suggestion');
        const suggestion_list = document.querySelector('.suggestion_list');

        function showSuggestions(element, suggestions) {
            suggestion_list.innerHTML = '';
            suggestions.forEach(suggestion => {
                const button = document.createElement('button');
                button.textContent = suggestion;
                suggestion_list.appendChild(button);
            });
        }
        
        // enable user to click labelled error_words
        typoParagraph.addEventListener('click', event => {
            suggestion_list.innerHTML = '';
        
            const popover_target = event.target.getAttribute('popovertarget');
            suggestion.setAttribute('id', popover_target)
        
            if (event.target.classList.contains('wrong')) {
                const word = popover_target;
                showSuggestions(event.target, getCorrections(word, error_words));
                setSuggestionPosition(event, suggestion);
            }
        });

        // re-enable button
        send_button.textContent = '>';
        send_button.disabled = false;

        // re-enable press enter key
        responseInProgress = false;

        // show copy button
        button_copy.classList.remove('hidden');
        button_copy.addEventListener('click', event => {
            copyParaphrase(document.querySelector('.paraphrase'));
            button_copy.textContent = 'Tersalin!'
            button_copy.disabled = true;
            setTimeout(() => {
                button_copy.textContent = 'Salin';
                button_copy.disabled = false;
            }, 2000);
        })
      });
}

// send data to the backend logic
async function sendData() {
    const button = document.querySelector('.submit_correction');
    button.disabled = true;

    // assigning data to variable
    const original_word = document.querySelector('.suggestion').getAttribute('id');
    const user_correction = document.querySelector('.user_correction').value;
    const data = {original_word, user_correction};

    try {
        const response = await fetch('', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'csrfmiddlewaretoken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                'data_type': 'user_correction',
                'user_correction': JSON.stringify(data)
              })
        });
        // Check if the request was successful
        if (response.ok) {
            const result = await response.json();
            console.log(result);
        } else {
            console.log(response.statusText);
        }
    } catch (error) {
        console.log(error.message);
    } finally {
        // Re-enable the button
        button.disabled = false;
        document.querySelector('.user_correction').value = '';

         // Show the thank you message
        const thankyou_alert = document.querySelector('.thankyou_alert');
        thankyou_alert.textContent = 'Terima kasih atas masukannya!';

         // Hide the thank you message after 3 seconds
         setTimeout(() => {
            thankyou_alert.textContent = '';
         }, 5000);
    }
}

// enable enter-key to send data
function handleKeyPress(event) {
    if (event.key === 'Enter' && event.target.classList.value == 'user_correction') {
        sendData();
    }
}