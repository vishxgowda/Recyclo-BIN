let model;
let isClassifying = false;
const classificationCount = 5;
const results = [];

async function loadModel() {
    model = await tf.loadLayersModel('tm-my-image-model/model.json');
    document.getElementById('result').innerText = 'Model loaded successfully!';
}

async function setupCamera() {
    const video = document.getElementById('video');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

async function classifyImage() {
    const video = document.getElementById('video');
    const img = tf.browser.fromPixels(video);
    const resized = tf.image.resizeBilinear(img, [224, 224]).expandDims(0).toFloat().div(tf.scalar(255));
    const predictions = await model.predict(resized).data();

    if (predictions.length === 5) {
        const classNames = ["Recyclable", "Non-Recyclable", "Biodegradable", "Filled Plastic Cover", "Glass"];
        const resultIndex = predictions.indexOf(Math.max(...predictions));
        const resultText = classNames[resultIndex];

        results.push(resultText);
        document.getElementById('result').innerText += `Prediction ${results.length}: ${resultText} (Score: ${predictions[resultIndex].toFixed(2)})\n`;

        if (results.length < classificationCount) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            classifyImage();
        } else {
            summarizeResults();
        }
    } else {
        document.getElementById('result').innerText += 'Error: Invalid prediction data\n';
    }
}

function summarizeResults() {
    const finalCounts = results.reduce((acc, label) => {
        acc[label] = (acc[label] || 0) + 1;
        return acc;
    }, {});

    const mostFrequentLabel = Object.keys(finalCounts).reduce((a, b) => 
        finalCounts[a] > finalCounts[b] ? a : b
    );

    document.getElementById('result').innerText += `\nFinal Detected Item: ${mostFrequentLabel} (Based on 5 classifications)\n`;
}

document.getElementById('startButton').addEventListener('click', async () => {
    await loadModel();
    await setupCamera();
    document.getElementById('result').innerText = "";
    results.length = 0;
    classifyImage();
});

loadModel();
