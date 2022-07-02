import React, { FC, useCallback } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import * as XLSX from 'xlsx';
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction, Signer } from '@solana/web3.js';

import {CopyToClipboard} from 'react-copy-to-clipboard';
import { GRAPE_RPC_ENDPOINT, TX_RPC_ENDPOINT } from '../../components/Tools/constants';
import { getTokenOwnerRecordForRealm } from '@solana/spl-governance';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount, createTransferInstruction } from "@solana/spl-token";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletError, WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { ValidateAddress } from '../../components/Tools/WalletAddress';
import {
  Typography,
  Button,
  Grid,
  Box,
  Paper,
  Link,
  Table,
  TextField,
} from '@mui/material/';
import { useSnackbar } from 'notistack';
import MUIDataTable from "mui-datatables";

import CircularProgress from '@mui/material/CircularProgress';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const StyledTable = styled(Table)(({ theme }) => ({
    '& .MuiTableCell-root': {
        borderBottom: '1px solid rgba(255,255,255,0.05)'
    },
}));

const Input = styled('input')({
    display: 'none',
  });

export function PaymentsView(props: any) {
    const [loading, setLoading] = React.useState(false);
    const freeconnection = new Connection(TX_RPC_ENDPOINT);
    const { connection } = useConnection();
    const { publicKey, wallet, sendTransaction } = useWallet();
    
    const [columns, setColumns] = React.useState([]);
    const [data, setData] = React.useState([]);
    const [memoText, setMemoText] = React.useState(null);
    const [transactionSignature, setTransactionSignature] = React.useState(null);
    const [grapeMemberBalance, setGrapeMemberBalance] = React.useState(0);
    const [grapeGovernanceBalance, setGrapeGovernanceBalance] = React.useState(0);

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const onError = useCallback(
        (error: WalletError) => {
            enqueueSnackbar(error.message ? `${error.name}: ${error.message}` : error.name, { variant: 'error' });
            console.error(error);
        },
        [enqueueSnackbar]
    );

    async function executeTransactions(transactions: Transaction, memo: string) {
        if (memo){
            transactions.add(
                new TransactionInstruction({
                    keys: [{ pubkey: publicKey, isSigner: true, isWritable: true }],
                    data: Buffer.from(JSON.stringify(memo), 'utf-8'),
                    programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
                })
            )
        }        

        try{
            enqueueSnackbar(`Preparing to batch pay`,{ variant: 'info' });
            const signature = await sendTransaction(transactions, freeconnection);
            
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            const latestBlockHash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: signature}, 
                'processed'
            );
        
            closeSnackbar(cnfrmkey);
            
            enqueueSnackbar(`Sent payments - ${signature}`,{ variant: 'success' });
            
            setTransactionSignature(signature);
        }catch(e){
            closeSnackbar();
            enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
        } 

    }
    
    async function transferTokenInstruction(tokenMintAddress: string, to: string, amount: number) {
        const fromWallet = publicKey;
        const toWallet = new PublicKey(to);
        const mintPubkey = new PublicKey(tokenMintAddress);
        const amountToSend = +amount;
        const tokenAccount = new PublicKey(mintPubkey);
        
        if (tokenMintAddress == "So11111111111111111111111111111111111111112"){ // Check if SOL
            const decimals = 9;
            const adjustedAmountToSend = amountToSend * Math.pow(10, decimals);
            const transaction = new Transaction()
            .add(
                SystemProgram.transfer({
                    fromPubkey: fromWallet,
                    toPubkey: toWallet,
                    lamports: adjustedAmountToSend,
                })
            );
            
            return transaction;
        } else{
            const accountInfo = await connection.getParsedAccountInfo(tokenAccount);
            const accountParsed = JSON.parse(JSON.stringify(accountInfo.value.data));
            const decimals = accountParsed.parsed.info.decimals;

            let fromTokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                fromWallet,
                mintPubkey,
                fromWallet,
                !ValidateAddress(fromWallet.toBase58()),
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
            );
            
            //console.log("validateAddress onCurve: "+ValidateAddress(toWallet.toBase58()))
            //console.log("Checking from: "+fromWallet.toBase58()+ " "+fromTokenAccount?.address?.toBase58());
            try{
                let toTokenAccount = await getOrCreateAssociatedTokenAccount(
                    connection,
                    fromWallet,
                    mintPubkey,
                    toWallet,
                    !ValidateAddress(toWallet.toBase58()),
                    TOKEN_PROGRAM_ID,
                    ASSOCIATED_TOKEN_PROGRAM_ID
                );
                const adjustedAmountToSend = amountToSend * Math.pow(10, decimals);
                
                const transaction = new Transaction()
                //console.log("Checking: "+toWallet.toBase58()+ " "+toTokenAccount?.address?.toBase58());
                if (toTokenAccount){
                    transaction.add(
                        createTransferInstruction(
                            fromTokenAccount.address,
                            toTokenAccount.address,
                            publicKey,
                            adjustedAmountToSend,
                            [],
                            TOKEN_PROGRAM_ID,
                        )
                    );
                } else{
                    console.log("Skipping: "+toWallet.toBase58()+ " could not get ATA (TokenAccountNotFoundError)");
                }

                console.log("here...")
                
                return transaction;
            }catch(e){
                return new Transaction();
            }
        }
    }

    const options = {
        responsive:"scroll",
        selectableRows: false,
        download:true,
        print:true,
        viewColumns:false,
        filter:false,
        rowsPerPage:20,
        rowsPerPageOptions:[20, 50, 100],
      };

    // process CSV data
  const processData = (dataString:any) => {
    const dataStringLines = dataString.split(/\r\n|\n/);
    const headers = dataStringLines[0].split(/,(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)/);
 
    const list = [];
    for (let i = 1; i < dataStringLines.length; i++) {
      const row = dataStringLines[i].split(/,(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)/);
      if (headers && row.length == headers.length) {
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
          let d = row[j];
          if (d.length > 0) {
            if (d[0] == '"')
              d = d.substring(1, d.length - 1);
            if (d[d.length - 1] == '"')
              d = d.substring(d.length - 2, 1);
          }
          if (headers[j]) {
            obj[headers[j]] = d;
          }
        }
 
        // remove the blank rows
        if (Object.values(obj).filter(x => x).length > 0) {
          list.push(obj);
        }
      }
    }
 
    // prepare columns list from headers
    const columns = headers.map((c:any) => ({
      name: c,
      selector: c,
    }));
 
    setData(list);
    setColumns(columns);
  }
 
  // handle file upload
  const handleFileUpload = (e:any) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      /* Parse data */
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      /* Get first worksheet */
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      /* Convert array of arrays */
      const data = XLSX.utils.sheet_to_csv(ws);
      //const data = XLSX.utils.sheet_to_csv(ws, { header: 1 });
      processData(data);
    };
    reader.readAsBinaryString(file);
  }
    
  async function HandlePayAll(event: any) {
    event.preventDefault();
    
    // loop through all data
    //console.log('dils: '+JSON.stringify(data));
    //console.log('cils: '+columns);

    let data_json = JSON.parse(JSON.stringify(data));
    let sum = 0;
    if (data.length <= 20){
        let batchtx = new Transaction();

        let grapecheck = await transferTokenInstruction('8upjSpvjcdpuzhfR1zriwg5NXkwDruejqNE9WNbPRtyA', 'GrapevviL94JZRiZwn2LjpWtmDacXU8QhAJvzpUMMFdL', 1);

        for (var value of data){
            // consider validating address
            // consider validating token
            if (value.token && value.address && value.amount && +value.amount > 0){
                let tokentouse = value.token;
                if (!ValidateAddress(tokentouse)){
                    tokentouse = '8upjSpvjcdpuzhfR1zriwg5NXkwDruejqNE9WNbPRtyA';
                }
                if (tokentouse !== '8upjSpvjcdpuzhfR1zriwg5NXkwDruejqNE9WNbPRtyA'){
                    let r = window.confirm("Token in this row ("+tokentouse+") is not Grape\n\nPress OK to set to Grape or Cancel to use "+value.token+"");
                    if (r)
                        tokentouse = '8upjSpvjcdpuzhfR1zriwg5NXkwDruejqNE9WNbPRtyA';
                }

                if (ValidateAddress(value.address)){
                    let singletx = await transferTokenInstruction(tokentouse, value.address, +value.amount);
                    if (singletx){
                        sum+=+value.amount;
                        //console.log('Transaction: '+JSON.stringify(singletx));
                        batchtx.add(singletx);
                    }
                } else{
                    console.log("Skipping "+value.address);
                }
            }
        }
        // Grape Check
        batchtx.add(grapecheck);
        let r = window.confirm("Total amount to send: "+sum+"\n+1 Grape will be sent to Grape Treasury\n\nPress OK to Pay All "+data.length+" or Cancel.");
        if (r)
            executeTransactions(batchtx, memoText);
    } else{
        enqueueSnackbar(`Up to 20 transactions can be completed in batch pay`,{ variant: 'error' });
    }
}
    const fetchBalances = async () => {
        const body = {
        method: "getTokenAccountsByOwner",
        jsonrpc: "2.0",
        params: [
            // Get the public key of the account you want the balance for.
            publicKey.toString(),
            { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
            { encoding: "jsonParsed", commitment: "processed" },
        ],
        id: "35f0036a-3801-4485-b573-2bf29a7c77d2",
        };

        const response = await fetch(GRAPE_RPC_ENDPOINT, {
            method: "POST",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
        })
        const json = await response.json();
        const resultValues = json.result.value
        return resultValues;

    };

    const fetchTokenAccountOwnerHoldings = async () => {
        setLoading(true);
        if (publicKey){ 
            //const portfolio_rsp = await connection.getTokenAccountsByOwner(publicKey, { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") },{ commitment: "processed" });
            let [portfolio_rsp, governance_rsp] = await Promise.all([fetchBalances(), getGovernanceBalance()]);
            
            let gov_balance = 0;
            try{
                if (governance_rsp?.account?.governingTokenDepositAmount){
                    gov_balance = +governance_rsp.account.governingTokenDepositAmount/1000000;
                    setGrapeGovernanceBalance(+governance_rsp.account.governingTokenDepositAmount/1000000 || 0);
                }
            }catch(e){
                console.log("ERR: "+e);
            }

            try{
                //if (grapeGovernanceBalance)
                //setGrapeMemberBalance(grapeGovernanceBalance);
                portfolio_rsp.map((token:any) => {
                    let mint = token.account.data.parsed.info.mint;
                    let balance = token.account.data.parsed.info.tokenAmount.uiAmount;
                    if (mint === '8upjSpvjcdpuzhfR1zriwg5NXkwDruejqNE9WNbPRtyA'){ // check if wallet has sol
                        setGrapeMemberBalance(gov_balance+balance);
                    }
                });
            } catch(e){console.log("ERR: "+e);}
            
        }
        setLoading(false);
    }
    const getGovernanceBalance = async () => {
        try{
            const programId = new PublicKey('GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw');
            const realmId = new PublicKey('By2sVGZXwfQq6rAiAM3rNPJ9iQfb5e2QhnF4YjJ4Bip'); // Grape RealmId
            const governingTokenMint = new PublicKey('8upjSpvjcdpuzhfR1zriwg5NXkwDruejqNE9WNbPRtyA'); // Grape Mint
            const governingTokenOwner = publicKey;

            const ownerRecords = await getTokenOwnerRecordForRealm(
                connection, 
                programId,
                realmId,
                governingTokenMint,
                governingTokenOwner
            );
            
            return ownerRecords;
        } catch(e){console.log("ERR: "+e);}
    }

    React.useEffect(() => { 
        if (publicKey && !loading)
            fetchTokenAccountOwnerHoldings();
    }, [publicKey]);

    if (loading){ 
        return (<>Loading...</>)
    } else{
        return (
                <React.Fragment>
                    <Grid item xs={12} md={12} lg={12}>
                        <Paper className="grape-paper-background">
                            <Box className="grape-paper">
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box className="grape-dashboard-component-header" sx={{ m: 0, position: 'relative' }}>
                                        <Typography gutterBottom variant="h6" component="div" sx={{ m: 0, position: 'relative'}}>
                                        DAO PAYMENTS
                                        </Typography>
                                    </Box>
                                </Box>
                                {grapeMemberBalance && grapeMemberBalance > 1130 ? (
                                    <Box sx={{ alignItems: 'center' }}>
                                            
                                        {transactionSignature ?
                                            <Grid 
                                                container
                                                alignItems="center"
                                                justifyContent="center"
                                            >
                                                <Grid xs={12}>
                                            
                                                    <Typography variant="caption">
                                                        Confirmation TX:
                                                        
                                                        <Button size="small" variant="text">
                                                            <CopyToClipboard 
                                                            text={transactionSignature} 
                                                            onCopy={() => enqueueSnackbar(`Copied ${transactionSignature}`,{ variant: 'success' })}
                                                            >
                                                                <ContentCopyIcon sx={{ fontSize:'14px', mr:0 }} />
                                                            </CopyToClipboard>
                                                        </Button>
                                                        <Button
                                                            variant='text'
                                                            href={`https://explorer.solana.com/tx/${transactionSignature}`} 
                                                            target="_blank"
                                                        >
                                                        {transactionSignature}
                                                        </Button>
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        :
                                            <Grid 
                                                container
                                                alignItems="center"
                                                justifyContent="center"

                                            >
                                                <Grid item xs={12} sx={{p:1,m:1}}>
                                                    
                                                    <Typography variant="caption" component="div" align="justify" >
                                                    <strong>CSV Format:</strong>
                                                    <br/><i>currently in use - address, amount, token * do not include parenthesis in the header</i>
                                                    <ul>
                                                        <li>seq (type:number)</li>
                                                        <li>identifier (type:string)</li> 
                                                        <li>address (type:string)</li>
                                                        <li>amount (type:number)</li>
                                                        <li>token (type:string)</li>
                                                        <li>notes (type:string)</li>
                                                    </ul>
                                                    </Typography>
                                                    
                                                    
                                                    <Typography variant="caption" component="div" align="justify" >
                                                    <strong>Instructions:</strong>
                                                    <ul>
                                                        <li>Add a CSV in the specified format</li>
                                                        <li>Verify the information is correct in the loaded table</li> 
                                                        <li>If everything is displaying correctly Press PAY ALL to proceed, otherwise re-upload a correct CSV file</li>
                                                        <li>A single Grape will be sent to the Grape treasury to run a transaction</li>
                                                    </ul>
                                                    </Typography>
                                                    <Typography variant="caption" component="div" align="justify" >
                                                    <strong>Notes:</strong>
                                                    &nbsp;Currently supports up to 20 payments in one go, will initialize tokens if they have not been initialized
                                                    </Typography>

                                                </Grid>
                                                <Grid item xs={12}>
                                                    <label htmlFor="contained-button-file">
                                                        <Input id="contained-button-file" 
                                                            type="file"
                                                            accept=".csv,.xlsx,.xls"
                                                            onChange={handleFileUpload} />
                                                        <Button 
                                                            variant="contained" 
                                                            component="span"
                                                            sx={{
                                                                margin:1
                                                            }}
                                                        >
                                                        <UploadFileIcon /> CSV
                                                        </Button>
                                                    </label>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <TextField 
                                                        id="send-memo" 
                                                        fullWidth 
                                                        placeholder="Add a memo for this transaction" 
                                                        label="Memo" 
                                                        variant="standard"
                                                        autoComplete="off"
                                                        onChange={(e) => {setMemoText(e.target.value)}}
                                                        sx={{
                                                            margin:1
                                                        }}
                                                        InputProps={{
                                                            inputProps: {
                                                                style: {
                                                                    textAlign:'left'
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </Grid>
                                                <Grid xs={12}>
                                                    <Button     
                                                        onClick={HandlePayAll}
                                                        variant="outlined" 
                                                        title="Pay all"
                                                        disabled={(data.length < 1)}
                                                        sx={{
                                                            margin:1
                                                        }}>
                                                        Pay All {(data.length > 0 && data.length)}
                                                    </Button>
                                                </Grid>
                                            </Grid>
                                        }
                                    
                                        <StyledTable size="small" aria-label="Payments Table">
                                            <MUIDataTable
                                                title={""}
                                                data={data}
                                                columns={columns}
                                                options={options}
                                                />
                                        </StyledTable>
                                    </Box>
                                )
                                :
                                (
                                    <Grid 
                                    container
                                    alignItems="center"
                                    justifyContent="center"
                                    >
                                        <Grid item xs={12}
                                        alignItems="center"
                                        justifyContent="center">
                                            <Typography variant="h5" component="div" 
                                                align="center" >
                                                Available only for Grape Members
                                            </Typography>
                                        </Grid>
                                    </Grid>  
                                )}
                            </Box>
                        </Paper>
                    </Grid>
                </React.Fragment>
        )
    }
}