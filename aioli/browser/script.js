document.getElementById("name").value = "input.fa";
document.getElementById("data").value = `>1aab_
GKGDPKKPRGKMSSYAFFVQTSREEHKKKHPDASVNFSEFSKKCSERWKT
MSAKEKGKFEDMAKADKARYEREMKTYIPPKGE
>1j46_A
MQDRVKRPMNAFIVWSRDQRRKMALENPRMRNSEISKQLGYQWKMLTEAE
KWPFFQEAQKLQAMHREKYPNYKYRPRRKAKMLPK
>1k99_A
MKKLKKHPDFPKKPLTPYFRFFMEKRAKYAKLHPEMSNLDLTKILSKKYK
ELPEKKKMKYIQDFQREKQEFERNLARFREDHPDLIQNAKK
>2lef_A
MHIKKPLNAFMLYMKEMRANVVAESTLKESAAINQILGRRWHALSREEQA
KYYELARKERQLHMQLYPGWSARDNYGKKKKRKREK`;

const CLI = await new Aioli(["kalign/3.3.1"]);

async function mountData(data) {
    await CLI.mount(data);
}

async function run(tries) {
    document.getElementById("output").innerHTML = "Loading...";

    let message = `running ${tries} time(s) ...`;
    log(message);

    const start = Date.now();

    let result;
    for (let j = 0; j < tries; j++) {
      await CLI.exec("kalign input.fa -f fasta -o result.fasta");
      result = await CLI.cat("result.fasta");
    }

    const end = Date.now();
    const duration = end - start;

    document.getElementById("output").innerHTML = result;
    message = `kalign ran ${tries} time(s) in ${duration} ms`;
    log(message);
    log('Done');
}

function log(text) {
    const pNode = document.createElement('p');
    pNode.innerText = text;
    document.getElementById("logs").append(pNode);
    console.log(text)
}

function clearLogs(){
    document.getElementById("logs").innerHTML = "";
    document.getElementById("output").innerHTML = "";
}

async function submitForm(e) {
    e.preventDefault();
    const formData = {
        name: document.getElementById("name").value,
        data: document.getElementById("data").value,
    };
    const tries = document.getElementById("reps").value;
    document.getElementById("action").disabled = true;
    await mountData(formData);
    await run(tries);
    document.getElementById("action").disabled = false;
}

document.getElementById('dataForm').addEventListener("submit", submitForm);
document.getElementById('clearLogs').addEventListener("click", clearLogs);
