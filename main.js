//ethers js 
import {ethers} from "./lib/ethers-5.0.min.js"
//localforage 
import "./lib/localforage.1.7.1.min.js";

/*/////////////////////////////////////////////////////////////////////////
  Databases
*/
////////////////////////////////////////////////////////////////////////

//Save db for Indexed DB - localforage
const DB = {
  price : localforage.createInstance({
    name: "CryptoTax.Price",
  }),
  ETH : localforage.createInstance({
    name: "CryptoTax.ETH",
  })
}

//handle db id generation
const DBId = (address, tx, chain = "ETH") => {
  let what = tx.traceId ? "internal" : tx.contractAddress
  return ethers.utils.id(chain + address + tx.hash + what) 
}

//chain ids for internal use 
const CHAINID = {
  "ETH" : "0x0",
  "BNB" : "0x38"
}
const CHAINNAME = {
  "ETH" : "Ethereum",
  "BNB" : "Binance Coin"
}

//ethers provider 
const provider = ethers.getDefaultProvider()
const BN = ethers.BigNumber
const formatUnits = ethers.utils.formatUnits

/*/////////////////////////////////////////////////////////////////////////
  Coin Gecko Coin IDs
*/
////////////////////////////////////////////////////////////////////////

//gecko names 
const COINID = {
  "0x0": "ethereum",
  "0x38": "binancecoin",
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "ethereum",
  "0xc011a72400e58ecd99ee497cf89e3775d4bd732f": "havven",
  "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f": "havven",
  "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": "uniswap",
  "0x6b175474e89094c44da98b954eedeac495271d0f": "dai",
  "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2": "sushi",
  "0xc00e94cb662c3520282e6f5717214004a7f26888": "compound-governance-token",
  "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e": "yearn-finance",
  "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0": "matic-network",
  "0xd533a949740bb3306d119cc777fa900ba034cd52": "curve-dao-token",
  "0xa1faa113cbe53436df28ff0aee54275c13b40975": "alpha-finance",
  "0xd46ba6d942050d489dbd938a2c909a5d5039a161": "ampleforth",
  "0x3472a5a71965499acd81997a54bba8d852c6e53d": "badger-dao",
  "0x45804880de22913dafe09f4980848ece6ecbaf78": "pax-gold",
  "0x798d1be841a82a273720ce31c822c61a67a601c3": "digg",
  "0x8207c1ffc5b6804f6024322ccf34f29c3541ae26": "origin-protocol",
  "0xdb25f211ab05b1c97d595516f45794528a807ad8": "stasis-eurs",
  "0x429881672b9ae42b8eba0e26cd9c73711b891ca5": "pickle-finance",
  "0xa0246c9032bc3a600820415ae600c6388619a14d": "harvest-finance",
  "0x57ab1e02fee23774580c119740129eac7081e9d3": "nusd",
  "0x57ab1ec28d129707052df4df418d58a2d46d5f51": "nusd",
  "0x36f3fd68e7325a35eb768f1aedaae9ea0689d723": "empty-set-dollar",
  "0x2a8e1e676ec238d8a992307b495b45b3feaa5e86": "origin-dollar",
  "0x5e74c9036fb86bd7ecdcb084a0673efc32ea31cb": "seth",
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "usd-coin",
  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": "bitcoin",
  "0xdac17f958d2ee523a2206206994597c13d831ec7": "tether",
  "0x8e870d67f660d95d5be530380d0ec0bd388289e1": "paxos-standard",
  "0xe41d2489571d322189246dafa5ebde1f4699f498": "0x",
  "0x111111111117dc0aa78b770fa6a738034120c302": "1inch",
  "0x4197c6ef3879a08cd51e5560da5064b773aa1d29": "acryptos",
  "0x5b17b4d5e4009b5c43e3e3d63a5229f794cba389": "acryptosi",
  "0x3ee2200efb3400fabb9aacf31297cbdd1d435d47": "cardano",
  "0xe9e7cea3dedca5984780bafc599bd69add087d56": "binance-usd",
  "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82": "pancakeswap-token",
  "0x2170ed0880ac9a755fd29b2688956bd959f933f8": "ethereum",
  "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d": "usd-coin",
  "0x23396cf899ca06c4472205fc903bdb4de249d6fc": "terrausd",
  "0x4bd17003473389a42daf6a0a729f6fdb328bbbd7": "vai",
  "0xcf6bb5389c92bdda8a3747ddb454cb7a64626c63": "venus",
  "0x62d71b23bf15218c7d2d7e48dbbd9e9c650b173f": "mirrored-google",
  "0xf215a127a196e3988c09d052e16bcfd365cd7aa3": "mirrored-tesla",
}

const geckoQueue = {}

//coin gecko call, date must be dd-mm-yyyy
const geckoPrice = async(tx,overwrite)=>{
  overwrite = overwrite || false
  let gId = tx.coin.gId
  //do not pull if it exist, or the gecko id doesn't exist 
  if (!gId)
    return
  //if price exists and it is not overwrite return
  if (tx._price && !overwrite)
    return

  let qId = gId + "." + tx.date
  tx._price = await DB.price.getItem(qId)

  if (!tx._price) {
    //add to queue
    if(geckoQueue[qId]) {
      geckoQueue[qId].push(tx.id)
    }
    else {
      geckoQueue[qId] = [tx.id]
    }

  }

  return true 
}

const manageQueue = () => {
  let five = Object.entries(geckoQueue).slice(0,5)
  //remove 
  five.forEach(q => delete geckoQueue[q[0]])
  //pick 5 and call them 
  five.forEach(q => {
      let [gId, date] = q[0].split(".")
      //call gecko 
      $.get("https://api.coingecko.com/api/v3/coins/" + gId + "/history?date=" + date)
        .then(gecko => {
          //get price from gecko 
          let price = gecko.market_data ? gecko.market_data.current_price.usd : 0
          //set db 
          DB.price.setItem(q[0], price)
          //now loop through tx and set 
          q[1].forEach(id => {
            UI.tx[id]._price = price
            UI.tx[id].save()
          })
        })
      
    })
}

//interval to manage queue
setInterval(()=> manageQueue() ,1000)

/*/////////////////////////////////////////////////////////////////////////
  Etherscan API
*/
////////////////////////////////////////////////////////////////////////

//etherscan data pull 
const ESAPI = "782MRPYDVGZGMH95PPVFX99Q4A4K636KFU"
const BSCAPI = "PK5M3M7V96CYDDRM8T95SXIJJSGR3QEFSP"

const ESBLOCKURL = "https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp="
const ESNORMAL = "https://api.etherscan.io/api?module=account&action=txlist&address="
const ESINTERNAL = "https://api.etherscan.io/api?module=account&action=txlistinternal&address="
const ESTOKEN = "https://api.etherscan.io/api?module=account&action=tokentx&address="

const BSCBLOCKURL = "https://api.bscscan.com/api?module=block&action=getblocknobytime&timestamp="
const BSCNORMAL = "https://api.bscscan.com/api?module=account&action=txlist&address="
const BSCINTERNAL = "https://api.bscscan.com/api?module=account&action=txlistinternal&address="
const BSCTOKEN = "https://api.bscscan.com/api?module=account&action=tokentx&address="


const getBlockByTime = async(year,month,chain = 'ETH')=>{
  let URL = chain == "ETH" ? ESBLOCKURL : BSCBLOCKURL
  let API = chain == "ETH" ? ESAPI : BSCAPI

  let local = localStorage.getItem(chain+"-"+year + "-" + month)
  if (local) {
    return JSON.parse(local)
  }

  //if it doesn exist pull it from etherscan
  let start = new Date(year,month,0)
    , end = new Date(year,month + 1,1)
    , now = Date.now();
  
  if(end > now) end = now

  let blockStart = await $.get(URL + Math.round(start / 1000) + "&closest=before&apikey=" + API)
    , blockEnd = await $.get(URL + Math.round(end / 1000) + "&closest=before&apikey=" + API);

  let block = {
    start: blockStart.result,
    end: blockEnd.result
  }

  //save 
  localStorage.setItem(year + "-" + month, JSON.stringify(block))

  return block
}

const getNormal = async(address,start,stop,chain = 'ETH')=>{
  let URL = chain == "ETH" ? ESNORMAL : BSCNORMAL
  let API = chain == "ETH" ? ESAPI : BSCAPI

  return await $.get(URL + address + "&startblock=" + start + "&endblock=" + stop + "&sort=asc&apikey=" + ESAPI)
}
const getInternal = async(address,start,stop,chain = 'ETH')=>{
  let URL = chain == "ETH" ? ESINTERNAL : BSCINTERNAL
  let API = chain == "ETH" ? ESAPI : BSCAPI

  return await $.get(URL + address + "&startblock=" + start + "&endblock=" + stop + "&sort=asc&apikey=" + ESAPI)
}
const getTokens = async(address,start,stop,chain = 'ETH')=>{
  let URL = chain == "ETH" ? ESTOKEN : BSCTOKEN
  let API = chain == "ETH" ? ESAPI : BSCAPI

  return await $.get(URL + address + "&startblock=" + Number(start) + "&endblock=" + Number(stop) + "&sort=asc&apikey=" + ESAPI)
}

/*/////////////////////////////////////////////////////////////////////////
  Export
*/
////////////////////////////////////////////////////////////////////////

//for saving later 
const download = (content,fileName,contentType)=>{
  var a = document.createElement("a");
  var file = new Blob([content],{
    type: contentType
  });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

const Export = {
  csv: {
    byAccounts(accounts) {},
    byCoin() {
      //run P&L 
      UI.PL()
      //put in array - concat data comes in arrays 
      let data = Object.values(coins)
        .sort((a,b) => {
          if(a.symbol < b.symbol) { return -1; }
          if(a.symbol > b.symbol) { return 1; }
          return 0;
        })
        .map(c=>c.csv()).flat()
      //join to produce scv string 
      let csvContent = data.map(e=>e.join(",")).join("\n")
      //call download
      download(csvContent, "cryptoTax.csv", 'text/csv')
    }
  },
  json(_tx) {
    let data = Object.values(UI.tx).map(tx => tx.export)
    //now download
    download(JSON.stringify(data), "cryptoTax" + ".json", 'text/plain') 
  },
  price() {
    //call price 
    let price = [], isPrice = true;
    DB.price.iterate((val,key) => {
      price.push([key,val])
    })
    .then(() => {
        download(JSON.stringify({isPrice,price}), "cryptoTaxPrice" + ".json", 'text/plain') 
      })
  }
}

/*/////////////////////////////////////////////////////////////////////////
  Coin Manager
*/
////////////////////////////////////////////////////////////////////////

let coins = {}
const addCoin = (address,symbol,name)=>{
  if (coins[address])
    return coins[address]
  //add 
  coins[address] = new Coin(address,symbol,name)
  return coins[address]
}

/*/////////////////////////////////////////////////////////////////////////
  Vue UI
*/
////////////////////////////////////////////////////////////////////////

Vue.component("transaction", {
  template: "#transaction",
  props: ["coin", "tx","i"],
  data() {
    return {
      keyR: 0,
      keyValue: 0,
      keyInput: 0,
      editDate: false,
    }
  },
  mounted() {
    this.tx.UI = this
  },
  computed : {
    HIFO () {
      return this.coin.PL.tx[this.i] || []
    },
    HIFOamt () {
      return this.HIFO.reduce((sum,tx) => sum+=tx.amt,0)
    },
    profit () {
      return this.HIFO.reduce((sum,tx) => sum+=tx.profit,0)
    },
    R () {
      let hids = this.coin.HIFOOrder.map(htx => htx.id)
      let i = hids.indexOf(this.tx.id)

      return i > -1 ? this.coin.PL.R[i] || 0 : 0 
    }
  },
  methods: {
    async copy(tx) {
      let data = tx.export
      //change id - append time to hash
      let time = Date.now()
      //new tx with new hash 
      let ntx = Object.assign({},tx._raw)
      //generate id 
      ntx.hash = [time,ntx.hash].join(".")
      let id = ntx.id = "0x"+time  
      //now save 
      await tx.db.setItem(id, ntx)
      //push to UI 
      UI.tx[id] = new Tx(ntx)
      //add to coin 
      UI.tx[id].coin._tx.push(id)
      //update coin 
      UI.PL()
      UI.setCoins()
      UI.keyFilter++
    },
    async save(tx) {
      await tx.save()
      //roll key to update UI
      UI.PL()
      this.keyInput++
      UI.keyFilter++
    },
  }
})

//creates the VUE js instance
const UI = new Vue({
  el: '#ui-main',
  data: {
    showAddress: false,
    address: "",
    accounts: [],
    coins: [],
    tx: {},
    year: 2020,
    years: [2019, 2020, 2021],
    month: 0,
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    filter: {
      types: ["address", "time"],
      by: "",
      time: [0, 0, 0, 0],
      address: "",
      active: [],
    },
    showCoin: '',
    showCostInput: -1,
    showFileSelect: false,
    showCoin: '',
    keyFilter: 0
  },
  mounted() {
    //pull accounts 
    this.accounts = localStorage.getItem("accounts") ? localStorage.getItem("accounts").split(",") : []
  },
  computed: {
    nCoins() {
      return this.coins.length
    },
  },
  methods: {
    PL () {
      this.coins.forEach(c => c.HIFO())
    },
    setCoins () {
      this.coins = Object.values(coins).sort((a,b) => {
        if(a.symbol < b.symbol) { return -1; }
        if(a.symbol > b.symbol) { return 1; }
        return 0;
      })
    },
    show(coin){
      if(this.showCoin==coin.contract) {
        this.showCoin = ''
      }
      else {
        //this.PL()
        this.showCoin = coin.contract
      }
    },
    addAddress() {
      let {accounts, address} = this
      //set new address
      if (!accounts.includes(address))
        accounts.push(address)
      localStorage.setItem("accounts", accounts)
    },
    addFilter() {
      let {by, active} = this.filter
      if (!active.includes(by)) {
        active.push(by)
        //update coin 
        this.setCoins()
        this.keyFilter++
        this.filter.by = ""
      }
    },
    removeFilter(i) {
      this.filter.active.splice(i, 1)
      //update coin 
      this.setCoins()
      this.keyFilter++
    },
    async loadDB() {
      let {tx} = this
      //iterate and set tx in UI
      //first eth 
      DB.ETH.iterate((val,key)=>{
        //add chain 
        let chain = val.chain = val.chain || "ETH"
        //always try to add coin 
        let coin = addCoin(val.contractAddress || CHAINID[chain], val.tokenSymbol || chain, val.tokenName || CHAINNAME[chain])
        //add weth to eth 
        if(["WETH","WBNB"].includes(val.tokenSymbol)){
          coin = coins[CHAINID[chain]]
        }

        tx[val.id] = new Tx(val)
        //update coin 
        if(!coin._tx.includes(val.id)){
          coin._tx.push(val.id)
        }

        //call coin gecko
        geckoPrice(tx[val.id])
        
      }).then(() => {
        this.setCoins()
        this.PL()
      })
    },
    async pullData(chain) {
      this.addAddress()
      let {address, year, month} = this
      let keys = await DB.ETH.keys()
      let blocks = await getBlockByTime(year, month, chain)

      const setItem = async(tx)=>{
        //add chain 
        tx.chain = chain
        //add contractAddress
        tx.contractAddress = tx.contractAddress || CHAINID[chain] 
        //generate dbid 
        let id = DBId(address, tx, chain)

        if (keys.includes(id))
          return

        //add address
        tx.id = id 
        tx.address = address
        //set 
        await DB.ETH.setItem(id, tx)
      }

      //pull from EtherScan - normal tx 
      let es = await getNormal(address, blocks.start, blocks.end,chain)
      if (es.status == "1") {
        es.result.forEach(async res=>await setItem(res))
      }

      //pull from EtherScan - internal tx 
      es = await getInternal(address, blocks.start, blocks.end,chain)
      if (es.status == "1") {
        es.result.forEach(async res=>await setItem(res))
      }

      //pull from EtherScan - tokens 
      es = await getTokens(address, blocks.start, blocks.end,chain)
      if (es.status == "1") {
        es.result.forEach(async res=>await setItem(res))
      }

      //now pullData
      this.loadDB()
    },
    async pullPrice(coin) {
      //get gecko price and overwrite
      await coin.tx.forEach(tx=>geckoPrice(tx, true))
    },
    //export all data 
    exportData() {
      Export.json(this.tx)
    },
    exportPrice () {
      Export.price()
    },
    csvByCoin() {
      Export.csv.byCoin()
    },
    csvByTx() {
      Export.csv.byTx(this.tx)
    },
    csvByAccounts() {
      Export.csv.byAccounts(this.accounts.slice())
    },
    async loadFile() {
      //pull file from input 
      let file = document.getElementById("file")
      let reader = new FileReader()
      reader.readAsText(file.files[0])

      //reset ui 
      this.showFileSelect = false

      const setItem = async(tx)=>{
        UI.address = tx.address 
        UI.addAddress()

        // set 
        await DB.ETH.setItem(tx.id, tx)
        return true
      }
      //set price db
      const setPrice = (arr) => {
        //loop through array
        arr.forEach(p => {
          DB.price.setItem(p[0],p[1])
        })
      }

      //after load - do this 
      reader.onload = async function() {
        let res = JSON.parse(reader.result)

        //set db
        if(res.isPrice){
          await setPrice(res.price)
        }
        else {
          await res.forEach(async tx=>await setItem(tx))
        }

        //pull
        UI.loadDB()
      }
    }
  }
})

/*/////////////////////////////////////////////////////////////////////////
  Coin Class 
*/
////////////////////////////////////////////////////////////////////////

//coin object - has basic info and stores tx  
class Coin {
  constructor(contract, symbol, name) {
    this.contract = contract
    this.symbol = symbol
    this.name = name

    //display 
    this.show = false
    this.showGas = false

    //for fill later 
    this._tx = []

    //Profit and Loss
    this.PL = {
      what : "HIFO",
      R : [],
      tx : []
    }
  }
  get gId() {
    return COINID[this.contract]
  }
  hasTx(id) {
    return this._tx.includes(id)
  }
  get filterCount() {
    return this.tx.filter(tx=>tx && (tx.amt!=0 && tx.filterAddress && tx.filterTime)).length
  }
  //always provide all - must have for using roll ups like cost/R 
  get tx() {
    return this._tx.map(id=>UI.tx[id]).sort((a,b)=>a.unix - b.unix)
  }
  //hifo 
  get HIFOOrder () {
    return this.tx.filter(tx => tx.isIn && !tx.exclude)
      .sort((a,b) => b.price - a.price)
  }
  HIFO () {
    let year = 365.25 * 24 * 60 * 60
    let washPeriod = 60*60*24*30
    let HIFO = this.HIFOOrder
    let R = HIFO.map(tx => tx.amt)
    let coinTotal = 0

    //reset wash 
    this.HIFOOrder.forEach(tx => tx._washVal = {})

    //map tx to thair claims  
    let HTX = this.tx.map((tx,i) => {
      //if exclude return 
      if(tx.exclude) return []

      //first run the tx linkedValue 
      tx.linkedValue()

      //ammount to claim 
      let amt = tx.ignore ? tx.gas : tx.totalAmt
      //keep runing total 
      tx.coinTotal = coinTotal += tx.isIn ? amt : -amt 

      //don't continue if input or no amt 
      if(tx.isIn || this.amt == 0) return []
      
      //date 
      let saleDate = (new Date(Number(tx.timeStamp) * 1000)).toLocaleDateString("en-US")

      //calc cost & profit
      let price = tx.price 
      let res = []

      //look for next buy 
      let nextBuy = this.tx.find(ntx=> ntx.isIn && !ntx.exclude && ntx.unix>tx.unix)
      if(nextBuy && nextBuy.unix-tx.unix > washPeriod ) {
        nextBuy = null
      }
      let washVal = 0

      //reduce HIFO to find ids 
      HIFO.forEach((htx,j)=>{
        let r = R[j]
        //check if nothing remains or amt is allotted for 
        if(r <= 0 || amt == 0 || htx.timeStamp > tx.timeStamp) return 

        //buy date
        let isShort = tx.timeStamp - htx.timeStamp < year
        let buyDate = (new Date(Number(htx.timeStamp) * 1000)).toLocaleDateString("en-US")

        //now reduce amt 
        let _amt = amt <= r ? amt : r 
        //push claim and reduce values 
        R[j] -= _amt
        amt -= _amt

        //profit and is wash
        let cost = _amt*htx.price
        let profit = _amt*price - cost
        let isWash = profit < 0 && nextBuy 

        //if wash push to next buy 
        if(isWash) {
          washVal += -profit
        }

        //track usage of htx 
        htx._out[tx.id] = [saleDate,_amt.toFixed(4)]

        //now push cost  
        res.push({
          amt: _amt,
          saleDate,
          buyDate,
          isShort,
          salePrice : _amt*price,
          buyPrice : htx.price,
          cost,
          profit,
          isWash,
          filterTime : tx.filterTime  
        })
      })

      //update washVal to tx 
      if(washVal > 0 && nextBuy) {
        nextBuy._washVal[tx.id] = washVal
      }

      return res 
    })

    this.PL = {what:"HIFO", R, tx:HTX}
  }
  //gas only tx 
  get gasOnly () {
    return this.tx.filter(tx=> tx.amt == 0 && tx.gas > 0 && tx.filterAddress && tx.filterTime)
  }
  get gasOnlyAmt () {
    return this.gasOnly.reduce((sum,tx) => sum+=tx.gas,0)
  }
  get interest() {
    return this.tx.reduce((sum,tx)=>sum += (tx.isInt ? tx.val : 0), 0)
  }
  csv() {
    //titles 
    let titles = ["#","Date Acquired","Date Sold","Sale Price","Cost","Adj","Gain/Loss","Code"]
    //track short and long 
    let short = []
      , long = []
      , tShort = [0, 0, 0, 0]
      , tLong = [0, 0, 0, 0];
    
    //run HIFO 
    this.HIFO()
    //for each PL - output 
    this.PL.tx.forEach(TX => {
      TX.forEach(tx => {
        if(!tx.filterTime) return
        //get proper array
        let what = tx.isShort ? short : long 
        let tWhat = tx.isShort ? tShort : tLong 
        let adj = tx.isWash ? (-tx.profit).toFixed(0) : ""
        let code = tx.isWash ? "W" : ""

        let amt = tx.amt.toFixed(4)
        let sale = tx.salePrice.toFixed(0)
        let cost = tx.cost.toFixed(0)
        let profit = tx.profit.toFixed(0)

        //push data
        // [#,Date Acquired,Date Sold,Sale Price,Cost,Adj,Gain/Loss,Code] 
        what.push([amt, tx.buyDate, tx.saleDate, sale, cost, adj, profit, code])

        //totals 
        tWhat[0] += tx.amt
        tWhat[1] += tx.salePrice
        tWhat[2] += tx.cost
        tWhat[3] += tx.profit
      })
    })

    let symbol = this.symbol + " " + this.contract.slice(2, 8)
    let data = [[]]
    if (this.interest > 0) {
      data.push([symbol, "interest", this.interest])
    }
    //short 
    if (short.length > 0) {
      data.push([], [tShort[0].toFixed(4), symbol, "short", tShort[1].toFixed(0), tShort[2].toFixed(0), "", tShort[3].toFixed(0)], titles)
      data = data.concat(short)
    }
    //long 
    if (long.length > 0) {
      data.push([], [tLong[0].toFixed(4), symbol, "long", tLong[1].toFixed(0), tLong[2].toFixed(0), "", tLong[3].toFixed(0)], titles)
      data = data.concat(long)
    }

    return data
  }
}

/*/////////////////////////////////////////////////////////////////////////
  Transaction Class 
*/
////////////////////////////////////////////////////////////////////////

//Transaction object
class Tx {
  constructor(tx) {
    //ui accounts
    let {accounts} = UI
    //pull tx data 
    this._raw = tx
    let {hash, contractAddress, from, to, tokenDecimal, tokenName, tokenSymbol, traceId, gasUsed, gasPrice, value} = tx
    //user input from tx 
    let {id, address, timeStamp, chain, _price, isInt, setAmt, setVal, exclude, ignore, ignoreLinks} = tx

    //symbol and token contractAddress
    this.chain = chain 
    this.symbol = tokenSymbol || chain
    this.contractAddress = contractAddress
    if(["WETH","WBNB"].includes(this.symbol)){
      this.contractAddress = CHAINID[chain]
    }

    //id 
    this.id = id 
    this.hash = hash

    //from and to , in or out tx  
    this.address = address
    this.to = to
    this.from = from
    this.isIn = to == address

    //time 
    this.timeStamp = timeStamp

    //format amount
    this.setAmt = setAmt ? Number(setAmt) : 0
    this._amt = Number(formatUnits(value, tokenDecimal || 18))
    this._price = null

    //gas if eth 
    this.gas = !this.isIn && this.contractAddress == CHAINID[chain] && gasUsed && Number(gasUsed) > 0 ? Number(formatUnits(BN.from(gasUsed).mul(gasPrice), 18)) : 0

    //user input 
    let crossTx = (accounts.includes(from) && this.isIn) || (accounts.includes(to) && !this.isIn && this.gas == 0)
    this.exclude = exclude || (crossTx && !hash.includes("."))
    // excludes the transaction completely
    this.ignore = ignore || false
    // ignores value for computaiton

    this._price = _price
    this.isInt = isInt || false
    this.setVal = Number(setVal || 0)
    //value from linked tx 
    this._linkedVal = 0
    this.ignoreLinks = ignoreLinks || false
    
    //handle wash 
    this.isWash = false 
    this._washVal = {}

    //runing totals
    this.coinTotal = 0 

    //tracking outputs 
    this._out = {}

    //allow for editing of copied tx 
    this._editDate = false
  }
  get unix() {
    return Number(this.timeStamp)
  }
  get date() {
    let[month,day,year] = this.time.toLocaleDateString("en-US").split("/")
    return [day, month, year].join("-")
  }
  get time() {
    return new Date(Number(this.timeStamp) * 1000)
  }
  get mayEdit() {
    return this.hash.includes(".")
  }
  //filter check
  get filterTime () {
    let {active, time} = UI.filter
    //get times 
    let start = new Date(time[0],time[1],1)
    let stop = new Date(time[2],time[3] + 1,0)
    return active.includes("time") ? this.time >= start && this.time <= stop : true
  }
  get filterAddress () {
    let {active, address} = UI.filter
    return active.includes("address") ? this.address == address : true
  }
  get filterShow () {
    //show if it is in the filter also if R>0
    return this.filterAddress && (this.isIn || this.filterTime)
  }
  get coin() {
    return coins[this.contractAddress]
  }
  set amt (_amt) {
    this.setAmt = _amt
  }
  get amt () {
    return this.setAmt > 0 ? this.setAmt : this._amt
  }
  get totalAmt() {
    return this.amt + this.gas
  }
  set val(_val) {
    this.setVal = Number(_val)
  }
  get val() {
    let price = this._price || 0
    //handle exclude and ignore 
    if(this.exclude) {
      return 0
    } 
    else if (this.ignore || this.amt == 0) {
      return this.gas * price
    }
    //if set val return that 
    else if (this.setVal != 0) {
      return this.setVal
    }
    //linked value 
    else if (this._linkedVal > 0) {
      return this._linkedVal + this.washVal
    }
    //finally return based on price 
    else {
      return (price * this.totalAmt) + this.washVal
    }
  }
  get washVal () {
    return Object.values(this._washVal).reduce((sum,val) => sum+=val,0)
  }
  get price() {
    let price = this._price || 0 
    let amt = this.totalAmt
    //account for wash 
    let wash = this.isIn ? this.washVal : 0

    //exclude totally 
    if(this.exclude) {
      return 0
    }
    else if (this.ignore) {
      return this._price || 0
    }
    //use set val 
    else if (this.setVal != 0) {
      //account for wash 
      return (this.setVal+wash) / amt 
    }
    //used linked value 
    else if (this._linkedVal > 0) {
      return (this._linkedVal + wash) / amt 
    }
    //base it off of amount + wash 
    else {
      return ((price * amt) + wash) / amt   
    }
  }
  get isLP () {
    //see if this is an LP 
    let LPs = ["SLP","1LP","UNI-V1","UNI-V2","gauge","bDIGG","bSLP"]
    return LPs.reduce((_isLP,id)=> _isLP || this.symbol.includes(id) ,false)
  }
  get linked() {
    if(this.exclude) return []
    return Object.values(UI.tx).filter(ltx=>ltx.id != this.id && ltx.hash == this.hash && ltx.amt > 0)
  }
  //get linked value 
  linkedValue () {
    let symbol = this.symbol
    let USD = ["DAI","USDT","USDC","BUSD"]
    //don't need linked val if the tx is USD 
    if(USD.includes(symbol) || this.ignoreLinks) {
      this._linkedVal = 0
      return
    }

    let isLP = this.isLP
    //use in this order of importance 
    let valSymbol = ["ETH","DAI","BUSD","USDT","USDC"]
    
    //reduce value based upon hierarchy 
    let val = this.linked.reduce((_val,tx) => {
      //if no amt return
      if(tx.amt == 0 || tx.symbol == symbol) return _val
      //check for index of usable value
      let i = valSymbol.indexOf(tx.symbol)
      //check index 
      if(i > _val[0]){
        _val[1] = tx.val
      }
      return _val 
    },[-1,0])

    //set internal
    this._linkedVal = isLP ? 2*val[1] : val[1]
  }
  get outputs () {
    return Object.values(this._out)
  }
  get txData() {
    //required tx data 
    let {hash, contractAddress, from, timeStamp, to, tokenDecimal, tokenName, tokenSymbol, traceId, gasUsed, gasPrice, value} = this._raw
    return {
      hash,
      contractAddress,
      from,
      timeStamp,
      to,
      tokenDecimal,
      tokenName,
      tokenSymbol,
      traceId,
      gasUsed,
      gasPrice,
      value
    }
  }
  get userInput() {
    //user input  
    let {id, address, chain, timeStamp, _price, isInt, setAmt, setVal, ignoreLinks, exclude, ignore} = this
    return {
      id,
      address,
      chain,
      timeStamp,
      _price,
      isInt,
      setAmt,
      setVal,
      ignoreLinks,
      exclude,
      ignore,
    }
  }
  get db() {
    return DB.ETH
  }
  async save() {
    let db = this.db
    let dbid = this.id 
    let tx = await db.getItem(dbid)
    if(!tx) return

    //join raw data with user state 
    Object.assign(tx, this.userInput)

    db.setItem(dbid, tx)
  }
  get export() {
    return Object.assign({}, this.txData, this.userInput)
  }
  get csv() {
    //let data = [["crypto", "#", "date acquired", "date sold", "sale price", "cost"]]
    return [this.symbol, this.totalAmt, this.buyDate, this.time.toLocaleDateString("en-US"), this.val, this.tCost]
  }
}
