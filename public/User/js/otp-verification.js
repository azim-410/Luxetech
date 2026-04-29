document.addEventListener('DOMContentLoaded', () => {
            // Handle OTP auto-advance, backspace, and pasting
            const inputs = document.querySelectorAll('.otp-inputs input');

            inputs.forEach((input, index) => {
                input.addEventListener('input', (e) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, '');
                    if (e.target.value !== '' && index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    }
                });

                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                        inputs[index - 1].focus();
                    }
                });

                input.addEventListener('paste', (e) => {
                    e.preventDefault();
                    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, inputs.length);
                    pastedData.split('').forEach((char, i) => {
                        inputs[i].value = char;
                        if (i < inputs.length - 1) {
                            inputs[i + 1].focus();
                        } else {
                            inputs[i].focus();  
                        }
                    });
                });
            });
        });

        // --- DOM Elements ---
        const resendBtn = document.querySelector('.btn-resend');
        const timerDisplay = document.querySelector('.timer-display');
        const submitBtn = document.querySelector('.btn-primary');
        const otpInputs = document.querySelectorAll('.otp-inputs input');

        // --- Configuration ---
        const COOLDOWN_SECONDS = 60;
        const COOLDOWN_EXPIERS = 540;

        // let resendTimer = null;
        let resendexpire = null;
        function all() {

            
            timeexpire = COOLDOWN_EXPIERS;
            timerDisplay.textContent = `Expire in ${timeexpire}`;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            submitBtn.disabled = false

            otpInputs.forEach(input => {
                input.value = '';
                input.style.opacity = '1';
                input.style.cursor = 'text';
                input.disabled = false
            });

            resendexpire = setInterval(() => {
                timeexpire--
                timerDisplay.textContent = `Expire in ${timeexpire}`;
                if (timeexpire < 0) {
                    clearInterval(resendexpire)
                    timerDisplay.textContent = `Time Expired`;

                    submitBtn.style.opacity = '0.5';
                    submitBtn.style.cursor = 'not-allowed';
                    submitBtn.disabled = true

                    otpInputs.forEach(input => {
                        input.style.opacity = '0.5';
                        input.style.cursor = 'not-allowed';
                        input.disabled = true
                    });
                }
            }, 1000)

            resendBtn.addEventListener('click', () => {
                
                all()

                let timeleft = COOLDOWN_SECONDS;
                resendBtn.textContent = `Resend Code ${timeleft}`;
                resendBtn.disabled = true;
                resendBtn.style.cursor = 'not-allowed';
                resendBtn.style.opacity = '0.5';
                resendBtn.style.textDecoration = 'none'

                const interval = setInterval(() => {
                    timeleft--;
                    resendBtn.textContent = `Resend Code ${timeleft}`;
                    if (timeleft < 0) {
                        clearInterval(interval);
                        resendBtn.textContent = "Resend Code";
                        resendBtn.disabled = false;
                        resendBtn.style.cursor = 'pointer';
                        resendBtn.style.opacity = '1';
                    }
                }, 1000);

            })
        } all()