import React, { FC, useCallback, useMemo } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Typography,

  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItemAvatar,
  ListItemIcon,
  ListItemText,
  ListItem,
  Divider,
  TextField,
  Grid,
  Backdrop,
  CircularProgress
} from '@mui/material';

const {prove} = require('@identity.com/prove-solana-wallet');
import { useSnackbar } from 'notistack';
import CloseIcon from '@mui/icons-material/Close';
import DisconnectIcon from '@mui/icons-material/LinkOff';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';

import bs58 from 'bs58';
import { sign } from 'tweetnacl';

import { NakedWallet } from '../../utils/wallet/NakedWallet';
import { useSession } from "../../contexts/session";
import Session from '../../models/Session';
import { PublicKey, SystemProgram, Transaction, TransactionInstruction, Signer } from '@solana/web3.js';
import { useConnection, ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletDialogProvider, WalletDisconnectButton, WalletMultiButton } from '../WalletAdapterMui';
//import { WalletDialogProvider, WalletDisconnectButton, WalletMultiButton } from '@solana/wallet-adapter-material-ui';
import { WalletAdapterNetwork, WalletError, WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { propsToClassKey } from '@mui/styles';

import { confirmDialog } from '../ConfirmDialog/ConfirmDialog';
import { GRAPE_APP_API_URL } from '../Tools/constants';

// Default styles
require('@solana/wallet-adapter-react-ui/styles.css');

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

export interface DialogTitleProps {
  id: string;
  children?: React.ReactNode;
  onClose: () => void;
}

const BootstrapDialogTitle = (props: DialogTitleProps) => {
  const { children, onClose, ...other } = props;

  return (
    <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
      {children}
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </DialogTitle>
  );
};

const WalletNavigation: FC = (props:any) => {
  //const { connection } = useConnection();
  const { userId, discordId, token, login } = props;
  const { session, setSession } = useSession();
  const { connection } = useConnection();
  const { publicKey, wallet, disconnect, sendTransaction, signMessage, signTransaction } = useWallet();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const message  = '$GRAPE';
  //session: Object;
  
  function sleep(milliseconds:number) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }

  async function disconnectSession(redirect:boolean) {
    await disconnect().catch(() => { /* catch any errors */ });
    setSession(null);
    if (redirect)
        window.location.href = "/";
  }

  function createNakedSession(cnsPublicKey: string){
    setSession(NakedWallet(cnsPublicKey, session));
  }
  
  async function confirmWalletWithSignTransaction() { 
    const amountToSend = 0;
    const decimals = 9;
    const adjustedAmountToSend = amountToSend * Math.pow(10, decimals);
    
    try{
      const transaction = new Transaction()
      .add(
          SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: publicKey,
              lamports: adjustedAmountToSend,
          })
      );
      transaction.feePayer = publicKey
      
      let blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
      transaction.recentBlockhash = blockhash;

      const sm_signature = await signTransaction(transaction);
    
      console.log('sm_signature: '+JSON.stringify(sm_signature));
      
      if (!sm_signature){
        console.log("Signature Verification = false");
        return null;
        //disconnectSession(true);
      }
      
      enqueueSnackbar(`Signing Transaction complete`,{ variant: 'success' });
      
      return sm_signature;

    }catch(e:any){
      closeSnackbar();
      enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
      //disconnectSession(true);
      return null;
    }
  }


  async function confirmWalletWithTransaction() { 
    const amountToSend = 0.00001;
    const decimals = 9;
    const adjustedAmountToSend = amountToSend * Math.pow(10, decimals);
    try{
      const transaction = new Transaction()
      .add(
          SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: publicKey,
              lamports: adjustedAmountToSend,
          })
      );
      
      //enqueueSnackbar(`Preparing to send ${amountToSend} ${name} to ${toaddress}`,{ variant: 'info' });
      console.log("Preparing transaction to self: " + amountToSend);
      enqueueSnackbar(`Preparing transaction`,{ variant: 'info' });
      const sm_signature = await sendTransaction(transaction, connection);

      const snackprogress = (key:any) => (
        <CircularProgress sx={{padding:'10px'}} />
      );
      const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
      const latestBlockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
          blockhash: latestBlockHash.blockhash,
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
          signature: sm_signature}, 
          'processed'
      );

      closeSnackbar(cnfrmkey);
      //enqueueSnackbar(`Transaction ready`,{ variant: 'info' });
      //enqueueSnackbar(`Please wait while the transaction completes, this may take a few seconds`,{ variant: 'info', autoHideDuration: 5000 });
      //console.log("Confirming Transaction: " + JSON.stringify(sm_signature));
      //sleep(5000);
      //enqueueSnackbar(`Confirming transaction`,{ variant: 'info' });
      //await connection.confirmTransaction(sm_signature, 'processed');
      //if (!transaction.verifySignatures()){
      
      if (!sm_signature){
        console.log("Signature Verification = false");
        disconnectSession(true);
      }
      
      enqueueSnackbar(`Transaction complete`,{ variant: 'success' });
      
      return sm_signature;
    }catch(e:any){
      closeSnackbar();
      enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
      disconnectSession(true);
      return null;
    }
  }

  //if (!publicKey) throw new WalletNotConnectedError();
  const VerifyWallet = useCallback(async (sent_publicKey) => {
    console.log("CD: Running wallet verification...");
    try {
        let naked_session = false;
        // `publicKey` will be null if the wallet isn't connected
        
        //console.log('pubkey: '+publicKey + ' vs ' + sent_publicKey);
        if (!publicKey){
          //console.log('CD: WALLET NOT CONNECTED...');
          //disconnect().catch(() => { /* catch any errors */ });
          //throw new Error('Wallet not connected!');
        }
        // `signMessage` will be undefined if the wallet doesn't support it
        //console.log("Checking signing support "+wallet?.name + " wallet");
        
        // ask to sign message only if no session
        
        if (!session.isConnected){
          //console.log("No session");
          if (!signMessage){ 
            if (wallet?.adapter.name){
              console.log(wallet?.adapter.name + ' wallet does not support message signing!');

              if (wallet?.adapter.name == "Solflare"){
              //  console.log("CD: SOLFLARE WALLET CONNECTED!");
              }

              if (wallet?.adapter.name){ // only if a wallet has a name but cannot sign (naked wallet)
                alert("WARNING: Message signing is not supported with "+wallet?.adapter.name+" for Grape Access!");
                // allow wallet to board but only as a naked wallet (since signing is required)
                createNakedSession(publicKey.toBase58());
                return null;
                //publicKey = null;
              }
            } else{
              //alert(publicKey);
              if ((publicKey)&&(login)){ // no wallet name but we have the publicKey:
                createNakedSession(publicKey.toBase58());
                naked_session = true;
                return null;
              }
            }
            //if (wallet.name != "Ledger"){
            disconnectSession(false);
            //alert("Wallet does not support message signing!");
            throw new Error('Wallet does not support message signing!');
          }
          
          // Encode anything as bytes
          const smessage = new TextEncoder().encode(message);
          // Sign the bytes using the wallet
          console.log(wallet?.adapter.name + " attempting to sign message");

          let fromTransaction = false;
          let sm_signature = await signMessage(smessage)
          .catch((error: any)=>{
            
            if (publicKey){
             
            } else{
                return null;
            }

          });

          if (!sm_signature){
            if (window.confirm("Grape signs a message to verify your wallet\n\nYour current wallet could not be verified, some wallets including Ledger do not support message signing, but can sign a transaction for verification, if you would like to sign a transaction to your wallet to confirm your wallet please press OK")){
              fromTransaction = true;
              sm_signature = await confirmWalletWithSignTransaction();
              sm_signature = new TextEncoder().encode(sm_signature); // convert to "utf-8"
            }
          }

          if (!sm_signature){
            if (window.confirm("Grape signs a message to verify your wallet\n\nYour current wallet could not be verified, some wallets including Ledger do not support message signing, if you would like to send a transaction to your wallet to confirm your wallet please press OK")){
              fromTransaction = true;
              sm_signature = await confirmWalletWithTransaction();
              sm_signature = new TextEncoder().encode(sm_signature); // convert to "utf-8"
            }
            
          }
          
          //console.log("sm_signature: "+sm_signature);
          if ((!sm_signature)&&(publicKey)){ // signature is null but there is a publickey
            // 1. set naked session (above)
            // 2. prompt user that they will need to make a transaction to themselves in order to have access to add/remove servers
            createNakedSession(publicKey.toString());
            return null;
          } else if (!sm_signature){ // invalid signature
            disconnectSession(false);
          }
          
          //console.log("smessage: "+smessage);
          //console.log("Signature: "+sm_signature);
          //console.log("pKey: "+publicKey.toBytes());

          // Verify that the bytes were signed using the private key that matches the known public key
          if (wallet?.adapter.name != "Slope"){
            if (!fromTransaction){ // verify signature from signed message
              if (!sign.detached.verify(smessage, sm_signature, publicKey.toBytes())){ 
                disconnectSession(false);
                throw new Error('CD: Invalid signature!');
              }
            }
          }

          const bs58_address = bs58.decode(publicKey.toString());
          const address = {"type":"Buffer","data":Object.values(bs58_address)}
          const signature = {"type":"Buffer","data":Object.values(sm_signature)}
          
          //const address = bs58.decode(bs58_address.toString());
          //const signature2 = bs58.decode(sm_signature); 

          //console.log("Signature 1: "+signature);
          //console.log("Signature 2: "+signature2);

          //const address = bs58.decode(signed.publicKey);
          //const decoded_signature = Buffer.from(signature, 'utf8');
          //const decoded_signature = Buffer.from(signature).toString('utf8');
          
          console.log(JSON.stringify({
              userId: userId,
              token: message,
              address: bs58_address,
              publicKey: publicKey.toString(),
              signature: signature,
              fromTransaction: fromTransaction
          }));

          console.log(wallet?.adapter.name + " connecting to Grape Dashboard...");
          
          if (login){ // login
            console.log("LOGIN GRAPE");
            if (GRAPE_APP_API_URL){
              const response = await fetch(`${GRAPE_APP_API_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token: message,
                    address: bs58_address,
                    publicKey: publicKey.toString(),
                    signature: signature,
                    fromTransaction: fromTransaction
                })
              }).catch( err => {
                console.log("ERROR: "+err);
                return null;
              });
              const session = await response.json();
            
              console.log(wallet?.adapter.name+" connected to Grape Dashboard!");
              session.token = {address, signature};
              session.publicKey = publicKey.toString();
              session.isConnected = true;
              session.fromTransaction = fromTransaction;
              if (!response)
                session.isWallet = false;
              else
                session.isWallet = true;
              setSession(session);
            } else{
              createNakedSession(publicKey.toBase58());
            }
          } else{ // register
            console.log("REGISTERING WITH GRAPE");
            console.log(JSON.stringify({
                userId: userId,
                token: token,
                address: bs58_address,
                publicKey: publicKey.toString(),
                signature: signature,
                fromTransaction: fromTransaction
            }));
            
            if (GRAPE_APP_API_URL){
              const response2 = await fetch(`${GRAPE_APP_API_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: userId,
                    token: token,
                    address: bs58_address,
                    publicKey: publicKey.toString(),
                    signature: signature,
                    fromTransaction: fromTransaction
                })
              }).catch( err => {
                console.log("ERROR: "+err);
                return null;
              });
              const session2 = await response2.json();
              console.log(wallet?.adapter.name+" connected to Grape Dashboard!");
              session2.token = {address, signature};
              session2.publicKey = publicKey.toString();
              session2.discordId = discordId;
              session.fromTransaction = fromTransaction;
              if (!response2){
                session2.isConnected = false;
                session.isWallet = false;
              }else{
                session2.isConnected = true;
                session.isWallet = true;
              }
              setSession(session2);
            }
            //console.log("CD: Session created ("+publicKey.toString()+")");
          }
          
            
        }
        return session;
    
    } catch (error: any) {
      console.log(`Signing failed: ${error?.message}`);
      disconnectSession(false);
      //setSession(null);
      return null;
    }
  }, [signMessage]);
//};

  //console.log('Pre call: '+publicKey);

  const [callstopk, setCallToPk] = React.useState(0);
  
  React.useEffect(() => { 
    
    setCallToPk(callstopk+1);

    if ((!session.publicKey)&&(publicKey)){
      if (publicKey.toString().length > 0){
        //console.log(callstopk+". CD SESSION CHANGED: "+session.publicKey);
        //console.log(callstopk+". CD WALLET PK: "+publicKey);  
        // show dialog to connect 
        VerifyWallet(publicKey);
      }
    }
  }, [publicKey]);

  // <WalletDisconnectButton startIcon={<DisconnectIcon />} style={{ marginLeft: 8 }} />
  return(
    <React.Fragment>
      <WalletMultiButton />
    </React.Fragment>
  );
}

const WalletButton: FC = (props:any) => {
  const [open, setOpen] = React.useState(false);
  const { publicKey, wallet, disconnect, sendTransaction, signMessage, signTransaction } = useWallet();
  
  function trimAddress(addr: string) {
    let start = addr.substring(0, 5);
    let end = addr.substring(addr.length - 4);
    return `${start}...${end}`;
  }

  function showWalletAddress(addr: string){
    return (
      <React.Fragment>
        <AccountBalanceWalletOutlinedIcon fontSize="small" sx={{ mr:1 }}  /> {trimAddress(addr)}
      </React.Fragment>
    )
  }
  
  const handleOpen = () => {
      setOpen(true);
    };
    const handleClose = () => {
      setOpen(false);
    };
    
   return(
      <WalletNavigation {...props} />
   );
  
};

export default function ConnectDialog(props: any) {
  const { isConnected, menuId, handleProfileMenuOpen, handleClickOpen, buttonText, nakedWallet, userId, discordId, token, login } = props;
  const [open, setOpen] = React.useState(false);
  const { session, setSession } = useSession();
  
  function trimAddress(addr: string) {
    let start = addr.substring(0, 5);
    let end = addr.substring(addr.length - 4);
    return `${start}...${end}`;
  }

  function showWalletAddress(addr: string){
    return (
      <React.Fragment>
        <AccountBalanceWalletOutlinedIcon fontSize="small" sx={{ mr:1 }}  /> {trimAddress(addr)}
      </React.Fragment>
    )
  }

  const ManualWalletForm = () => {
    const [walletId, setInputValue] = React.useState('');
    const [error, setError] = React.useState(false)
    const handleInput = (val: any) => {
      return val;
    };

    function handleSubmit(event: any) {
      event.preventDefault();
      // use the inputValue which is the wallet ID
      console.log( 'MANUALLY SET WALLET ID:' + walletId); 
      if ((walletId.length >= 32) && 
          (walletId.length <= 44)){
        // WalletId is base58 validate the type too later on
        setSession(NakedWallet(walletId, session));
        handleClose();
      } else{
        // Invalid Wallet ID
        
      }
        //console.log( 'SET WALLET:', walletId); 
    }
    
    //console.log("CONNECT USERID: "+walletId);

    return (
        <>
          <form onSubmit={handleSubmit}>
            <Grid container>
              <Grid item>
                <TextField
                  autoFocus
                  autoComplete='off'
                  margin="dense"
                  id="wallet_id"
                  label="Paste Wallet ID"
                  type="text"
                  fullWidth
                  variant="standard"
                  value={walletId}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </Grid>
              <Grid item alignItems="center" style={{ display: "flex" }}>
                <Button 
                  type="submit"
                  variant="contained" 
                  title="GO">
                    Go
                </Button>
              </Grid>
            </Grid>
          </form>
        </>
    );
  }

  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  
  const wallet_connect_body = (
    <React.Fragment>
      {nakedWallet &&
        <React.Fragment>
          <Divider />
          <ManualWalletForm />
        </React.Fragment>
      }
    </React.Fragment>
  );

  return (
    <>
      <WalletDialogProvider>    
        <WalletButton {...props}/>
        {wallet_connect_body}
      </WalletDialogProvider>
    </>

  );
}