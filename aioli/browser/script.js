const CLI = await new Aioli(["kalign/3.3.1"]);

// Create sample data (source: https://github.com/TimoLassmann/kalign/blob/master/dev/data/BB11001.tfa)
await CLI.mount({
  name: "input.fa",
  data: `>1aab_
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
KYYELARKERQLHMQLYPGWSARDNYGKKKKRKREK`
});

// Run kalign and fetch FASTA file output

const rounds = 5;

for (let i = 0; i < rounds; i++) {
  const start = Date.now();

  const tries = Math.pow(10, i);
  for (let j = 0; j < tries; j++) {
    await CLI.exec("kalign input.fa -f fasta -o result.fasta");
    const result = await CLI.cat("result.fasta");
    document.getElementById("output").innerHTML = result;
  }

  const end = Date.now();
  const duration = end - start;

  const message = `kalgin ran ${tries} time(s) in ${duration} ms`;
  log(message);
}

log('Done');

function log(text) {
  const pNode = document.createElement('p');
  pNode.innerText = text;
  document.getElementById("logs").append(pNode);
  console.log(text)
}