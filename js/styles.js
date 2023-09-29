window.applyStyles = function() {
    const amountSpentLabel = document.querySelector('.amountSpentLabel');
    if (!amountSpentLabel) return;
    amountSpentLabel.style.color = 'black';
    amountSpentLabel.style.position = 'absolute';
    amountSpentLabel.style.top = '50%';
    amountSpentLabel.style.left = '50%';
    amountSpentLabel.style.transform = 'translate(-50%, -50%)';
    amountSpentLabel.style.fontWeight = 'bold';
    amountSpentLabel.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    amountSpentLabel.style.borderRadius = '5px';
    amountSpentLabel.style.padding = '0 5px';

    const amountRequiredLabel = document.querySelector('.amountRequiredLabel');
    if (!amountRequiredLabel) return;
    amountRequiredLabel.style.color = '{color}';
    amountRequiredLabel.style.marginLeft = '10px';

    const progressBarContainer = document.querySelector('.progressBarContainer');
    if (!progressBarContainer) return;
    progressBarContainer.style.position = 'relative';

}