// assume user input is in the following format:
// caseNum1|imageUrl1|category1|alg1,votes1,date1|alg2,votes2,date2|alg3,votes3,date3,caseNum2|imageUrl2|category2|alg1,votes1,date1|alg2,votes2,date2|alg3,votes3,date3
// where '|' separates the different cases and ',' separates the different alg properties
const input = prompt("What's your name?");
alert(`Your name is ${input}`);
const userInput = "1|http://cubiclealgdbimagegen.azurewebsites.net/generator?&puzzle=3&case=R%20U2%20R2%27%20F%20R%20F%27%20U2%20R%27%20F%20R%20F%27&view=trans&stage=oll|Dot|R U2 R2 F R F' U2 R' F R F',1,2023|R U2 R2 F R F' U2 R' F R F',2,2023|R U2 R2 F R F' U2 R' F R F',4,2023|R U2 R2 F R F' U2 R' F R F',6,2023|R U2 R2 F R F' U2 R' F R F',7,2023|2|http://cubiclealgdbimagegen.azurewebsites.net/generator?&puzzle=3&case=F%20R%20U%20R%27%20U%27%20F%27%20f%20R%20U%20R%27%20U%27%20f%27&view=trans&stage=oll|Dot|F R U R' U' F' f R U R' U' f',8,2023|R U2 R2 F R F' U2 R' F R F',2,2023|R U2 R2 F R F' U2 R' F R F',4,2023|R U2 R2 F R F' U2 R' F R F',6,2023|R U2 R2 F R F' U2 R' F R F',7,2023";

const cases = userInput.split('|');

const result = cases.map(caseStr => {
  const [caseNum, imageUrl, category, ...algsStr] = caseStr.split('|');
  const algs = algsStr.map(algStr => {
    const [alg, votes, date] = algStr.split(',');
    return {alg, votes, date};
  });
  return {caseNum, imageUrl, category, algs};
});

console.log(result);
