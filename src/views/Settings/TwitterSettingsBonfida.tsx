import React, { FC, useCallback, useMemo, ReactElement } from 'react';
import {CopyToClipboard} from 'react-copy-to-clipboard';

import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Grid,
  Button,
  Paper,
  TableRow,
  TableCell,
  Typography,
  TextField,
  Tooltip,
  Dialog,
  DialogProps,
  IconButton,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import{
  styled, createTheme
} from '@mui/material/styles';

import MuiAlert, { AlertProps } from '@mui/material/Alert';

import Snackbar, { SnackbarOrigin } from '@mui/material/Snackbar';
import { sign } from 'tweetnacl';

import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { useSnackbar } from 'notistack';
import { useConnection, ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork, WalletError, WalletNotConnectedError } from '@solana/wallet-adapter-base';

import { Connection, PublicKey, Keypair, SystemProgram, Transaction, clusterApiUrl } from '@solana/web3.js';

import { BONFIDA_TWITTER_REGISTRAR_URL } from '../../components/Tools/constants';

import { useSession } from "../../contexts/session";
import { MakeLinkableAddress, ValidateAddress } from '../../components/Tools/WalletAddress'; // global key handling
import { deleteTwitterRegistry, createVerifiedTwitterRegistry, getHandleAndRegistryKey, getTwitterRegistry, getTwitterHandleandRegistryKeyViaFilters } from '@solana/spl-name-service';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
  ) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
      width: theme.spacing(60),
      margin: 0,
  },
  '& .MuiDialogTitle-root': {
      //backgroundColor: theme.palette.primary.main,
      //backgroundColor: '#000000',  /* fallback for old browsers */
      backgroundColor: 'rgb(0 0 0 / 50%)',
      '& .MuiTypography-root': {
          display: 'flex',
          justifyContent: 'space-between',
          lineHeight: theme.spacing(5) + 'px',
      },
      '& .MuiIconButton-root': {
          flexShrink: 1,
          padding: theme.spacing(),
          marginRight: theme.spacing(2),
          color: theme.palette.grey[500],
      },
  },
  '& .MuiDialogContent-root': {
      padding: 0,
      '& .MuiCollapse-root': {
          '& .MuiList-root': {
              background: theme.palette.grey[900],
          },
      },
      '& .MuiList-root': {
          background: theme.palette.grey[900],
          padding: 0,
      },
      '& .MuiListItem-root': {
          boxShadow: 'inset 0 1px 0 0 ' + 'rgba(255, 255, 255, 0.1)',
          '&:hover': {
              boxShadow:
                  'inset 0 1px 0 0 ' + 'rgba(255, 255, 255, 0.1)' + ', 0 1px 0 0 ' + 'rgba(255, 255, 255, 0.05)',
          },
          padding: 0,
          '& .MuiButton-endIcon': {
              margin: 0,
          },
          '& .MuiButton-root': {
              flexGrow: 1,
              justifyContent: 'space-between',
              padding: theme.spacing(1, 3),
              borderRadius: undefined,
              fontSize: '1rem',
              fontWeight: 400,
          },
          '& .MuiSvgIcon-root': {
              color: theme.palette.grey[500],
          },
      },
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

export interface TwitterDialogProps extends Omit<DialogProps, 'title' | 'open'> {
  title?: ReactElement;
}

export function TwitterBoardingDialog(props:any){

  const [open_dialog, setOpenPKDialog] = React.useState(false);
  const [walletPKId, setInputPKValue] = React.useState('');
  const [open_snackbar, setSnackbarState] = React.useState(false);
  const [twitter_url, setTwitterURL] = React.useState(null);
  const [twitter_handle, setTwitterHandle] = React.useState(null);
  const { session, setSession } = useSession();
  const { publicKey, wallet, connected, disconnect, autoConnect, sendTransaction, signTransaction, signMessage } = useWallet();
  const { connection } = useConnection();
  const [loading_registration, setLoadingRegistration] = React.useState(false);
  const [new_twitter_registration, setTwitterRegistration] = React.useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const onError = useCallback(
    (error: WalletError) => {
        enqueueSnackbar(error.message ? `${error.name}: ${error.message}` : error.name, { variant: 'error' });
        console.error(error);
    },
    [enqueueSnackbar]
  );

  const handleCopyClick = () => {
    setSnackbarState(true);
  };

  const postTwitterRegistrarRequest = async (
    transaction: Transaction,
    userPubkey: PublicKey,
    twitterLink: string,
    twitterHandle: string
  ) => {
    const transactionBuffer = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    const payload = {
      transaction: JSON.stringify(transactionBuffer),
      pubkey: userPubkey.toBase58(),
      twitterLink: twitterLink,
      twitterHandle: twitterHandle,
    };

    if (BONFIDA_TWITTER_REGISTRAR_URL){
      const result = await fetch(BONFIDA_TWITTER_REGISTRAR_URL, {
        method: "POST",
        headers: new Headers({
            "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload)
        //body: payload
      }).catch((error)=>{
        console.log("ERROR REGISTERING TWITTER HANDLE!")
      });
      return result;
    } else{
      return null;
    }
  };

  async function registerWithConnectedWallet(twitterHandle:string, twitterUrl:string){
    
    const space = 1_000; // The space that the user will have to write data into the verified registry
    
    if (wallet){
      setLoadingRegistration(true);
      enqueueSnackbar(`Creating verified twitter registry...`,{ variant: 'success' });
      const instruction = await createVerifiedTwitterRegistry(
        connection,
        twitterHandle,
        publicKey,
        space,
        publicKey,
      );
      
      console.log("Preparing Transaction");
      enqueueSnackbar(`Preparing Transaction...`,{ variant: 'success' });
      const transaction = new Transaction().add(...instruction);
      if (transaction){
        transaction.recentBlockhash = (
          await connection.getRecentBlockhash("finalized")
        ).blockhash;
        
        transaction.feePayer = publicKey;//wallet.publicKey;
        try{
          //console.log("Transaction ready: "+JSON.stringify(transaction));
          console.log("Signing Transaction...");
          enqueueSnackbar(`Signing Transaction`,{ variant: 'success' });
          
          console.log(wallet?.adapter.name+": "+connected);
          //const smessage = new TextEncoder().encode('$GRAPE');
          //const sm_signature = await signMessage(smessage);

          const signature = await signTransaction(transaction)
          //const signature = await sendTransaction(transaction, connection)
          .catch((error: any)=>{
            setLoadingRegistration(false);
            throw new Error('Request was not completed: '+error);
          });
          
          //console.log("Signed: "+JSON.stringify(signature));
          enqueueSnackbar(`Signed Transaction`,{ variant: 'success' });
          
          if (!signature){
            setLoadingRegistration(false);
            throw new Error('Invalid signature!');
          }else{
          // await connection.confirmTransaction(signature, 'processed');
          }

          enqueueSnackbar(`Creating Twitter Registration: ${publicKey} + @${twitterHandle}`,{ variant: 'success' });
          const result = await postTwitterRegistrarRequest(
            transaction,
            publicKey,
            twitterUrl,
            twitterHandle
          )
          .then(function(result_response) {
            if (result_response){
              
              enqueueSnackbar(`Twitter Registration Complete`,{ variant: 'success' });
              console.log("Result Response: "+JSON.stringify(result_response));
              const timeout = setTimeout(() => {
                props.setNewTwitterRegistration(twitterHandle);
              }, 10000); // added a small delay
              
            } else{
              const action = (key:any) => (
                  <Button href={`https://naming.bonfida.org/#/twitter-registration`} target='_blank' sx={{color:'white'}} >
                    Try Again
                  </Button>
              );
              enqueueSnackbar(`Something went wrong! Toggle the wallet tab to refresh and see if your handle was registered`,{ variant: 'error', action });
              setLoadingRegistration(false);
            }
          })
          .catch((error)=>{
            setLoadingRegistration(false);
            throw new Error('Request was not completed: '+error);
          });    
        } catch(e){
          setLoadingRegistration(false);
          console.log("ERR: "+e);
          throw new Error('Error: '+e);
        }
      } else{
        setLoadingRegistration(false);
        console.log("Invalid transaction!");
        throw new Error('Invalid transaction!');
      }
    } else{
      setLoadingRegistration(false);
      console.log("Wallet not connected!");
      throw new Error('Wallet not connected!');
    }
  }

  const handleCloseSnackbar = (event?: React.SyntheticEvent, reason?: string) => {
      if (reason === 'clickaway') {
          return;
      }
      setSnackbarState(false);
  };
  
  const steps = [
    {
      label: 'Copy your wallet address',
      description: `Your wallet address will be linked with your twitter handle, is this your wallet address that you would like to link ${publicKey}`,
    },
    {
      label: 'Tweet your wallet address',
      description:
        'Login to your twitter account and tweet only your wallet address. Once completed copy the tweet url and return here.',
    },
    {
      label: 'Enter your twitter information',
      description: `Fill out the input fields by entering your twitter handle along with the tweet url of your wallet address you published on the previous step`,
    },
  ];
  
  //const handleClickOpenDialog = () => {
  const handleClickOpenDialog = useCallback(async () => {  
    if (!publicKey) throw new WalletNotConnectedError();
    handleReset();
    setOpenPKDialog(true);
  }, [publicKey, sendTransaction, connection]);
  
  const handleCloseDialog = () => {
      setOpenPKDialog(false);
  };

  const [activeStep, setActiveStep] = React.useState(0);
  
  const VerifyLastStepWallet = useCallback(async (twitter_handle:string, twitter_url:string) => {
    registerWithConnectedWallet(twitter_handle, twitter_url)
    .catch(function (error){
      console.log("ERROR COMPLETING REGISTRATION ("+publicKey+"): "+error)}
    ); //getHandleAndRegistryKey(connection, publicKey);;
  }, [publicKey, sendTransaction, connection]);

  const handleNext = () => {
    if (activeStep === 2){
      // we need to validate the data
      if ((twitter_url) && 
          (twitter_handle)){
        if ((twitter_url.length > 10)&&
            (twitter_handle.length > 2)){
              VerifyLastStepWallet(twitter_handle, twitter_url);
              setActiveStep((prevActiveStep) => prevActiveStep + 1);
        } else{
          alert("Invalid Entry");
        }

      } else{
        alert("Invalid Entry");
      }
    } else{
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleCopyNext = () => {
    setSnackbarState(true);
    navigator.clipboard.writeText(publicKey.toString());
    handleNext();
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  function setTwitterHandleRegEx(props:string){
    setTwitterHandle(props.replace(/[@]/g, ''));
  }
  
  const TwitterRegistrationLastStep = () =>{

    if (new_twitter_registration){
      enqueueSnackbar(`Twitter Registration Succeeded for ${twitter_handle}`,{ variant: 'success' });
    }else if (!loading_registration && !new_twitter_registration){
      enqueueSnackbar(`Twitter Registration Failed...`,{ variant: 'error' });
      handleCloseDialog();
    }
    return (
      <Grid 
        container 
        direction="column" 
        alignItems="center" 
        justifyContent="center" 
        sx={{ p: 2 }}>
          <Grid item xs={3}>
          {loading_registration ? 
              <Typography align="center">Processing Twitter Handle NS Registration...
                <CircularProgress color="inherit" />
              </Typography>
        : 
          <div>
            {new_twitter_registration ?
              <Typography align="center">Registration complete {new_twitter_registration}!</Typography>
            :
              <Typography align="center">Registration failed!</Typography>
            }
          </div>
        } 
        </Grid>
      </Grid>
    );
  }

  return (
    <React.Fragment>
      
      <Tooltip title={`Link Twitter`}><Button 
        //disabled={!publicKey && !wallet}
        disabled={!publicKey}
        //disabled={!session.publicKey}
        color="primary" size="small" variant="contained" onClick={handleClickOpenDialog}><LinkIcon sx={{mr:1}}/> Link Twitter</Button>
      </Tooltip>
        <BootstrapDialog
          open={open_dialog} 
          onClose={handleCloseDialog} 
          //fullWidth={true}
          maxWidth={"lg"}
          PaperProps={{ 
            style: {
                background: 'linear-gradient(to right, #251a3a, #000000)',
                boxShadow: '3',
                border: '1px solid rgba(255,255,255,0.15)',
                borderTop: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '20px',
                padding:'4'
                },
            }}
          >
      
          <DialogTitle>
          <Typography variant="h6">
              <Grid container direction="row" alignItems="center">
                <Grid item>
                  <TwitterIcon  sx={{mr:1}} />
                </Grid>
                <Grid item>Register Wallet with your Twitter Account
                </Grid>
              </Grid>
            </Typography>
          </DialogTitle>
          <DialogContent>
              <Box sx={{ maxWidth: 400, p: 1 }}>
                <Stepper activeStep={activeStep} orientation="vertical">
                  {steps.map((step, index) => (
                    <Step key={step.label}>
                      <StepLabel
                        optional={
                          index === 2 ? (
                            <Typography variant="caption">Last step</Typography>
                          ) : null
                        }
                      >
                        {step.label}
                      </StepLabel>
                      <StepContent>
                        <Typography>{step.description}</Typography>
                        <Box sx={{ mb: 2 }}>
                          <div>
                            {index === 1 ?
                              // add one more button to tweet quickly
                              <Button
                                  variant="outlined"
                                  //onClick={handleCopyNext}
                                  href={`https://twitter.com//intent/tweet?text=${publicKey}`} 
                                  target="_blank"
                                  sx={{ mt: 1, mr: 1 }}
                                >
                                  <TwitterIcon sx={{mr:1}} /> Tweet
                                </Button>
                            : null}


                            {index === steps.length - 1 ? 
                              <React.Fragment>
                                  <TextField 
                                    fullWidth 
                                    id="grape-twitter-handle" 
                                    label="Twitter Handle" 
                                    variant="standard" 
                                    margin="normal"
                                    onChange={(e) => setTwitterHandleRegEx(e.target.value)} 
                                  />
                                
                                  <TextField 
                                    fullWidth 
                                    id="grape-twitter-url" 
                                    label="Tweet URL" 
                                    variant="standard" 
                                    margin="normal"
                                    onChange={(e) => setTwitterURL(e.target.value)} 
                                  />
                              </React.Fragment>  
                            : 
                            null}

                            {index === 0 ?
                                <Button
                                  variant="contained"
                                  onClick={handleCopyNext}
                                  sx={{ mt: 1, mr: 1 }}
                                >
                                  <ContentCopyIcon sx={{mr:1}} /> Copy &amp; Continue
                                </Button>
                              :
                                <Button
                                  variant="contained"
                                  onClick={handleNext}
                                  sx={{ mt: 1, mr: 1 }}
                                >
                                  {index === steps.length - 1 ? 'Finish' : 'Continue'}
                                </Button>
                            }
                            
                            {index !== 0 &&
                            <Button
                              disabled={index === 0}
                              onClick={handleBack}
                              sx={{ mt: 1, mr: 1 }}
                            >
                              Back
                            </Button>
                            }
                          </div>
                        </Box>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
                {activeStep === steps.length && 
                    <TwitterRegistrationLastStep />
                }
              </Box>
          </DialogContent>
      </BootstrapDialog>   
      <Snackbar open={open_snackbar} autoHideDuration={2000} message="Copied">
          <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Copied!
          </Alert>
      </Snackbar>
    </React.Fragment>
  );
}

export const TwitterSettings: FC = (props: any) => {
  const { session, setSession } = useSession();
  const { publicKey, wallet, disconnect, sendTransaction, signTransaction, signMessage } = useWallet();
  const { connection } = useConnection();
  const [newTwitterRegistration, setNewTwitterRegistration] = React.useState(null);
  const [twitterRegistration, setTwitterRegistry] = React.useState(null);
  const [twitterRegistryKey, setTwitterRegistryKey] = React.useState(null);
  const [loadingTwitter, setLoadingRPC] = React.useState(false);
  const [twitterOnChainRegistration, setTwitterOnChainRegistry] = React.useState(null);
  //const wallet = props.wallet;
  const endpoint = props.endpoint;
  const { enqueueSnackbar } = useSnackbar();

  async function deregisterTwitterWithConnectedWallet(){
    
    if ((wallet)&&(twitterRegistryKey)){
      setLoadingRPC(true);
      //console.log(twitterRegistration + ", "+ publicKey.toString());

      //if (typeof twitterRegistration === 'string')
      //  console.log("Is string type");
      //var twtrstr: string = String(twitterRegistration);
      const instruction = await deleteTwitterRegistry(twitterRegistration, publicKey);
      //const instruction = await deleteTwitterRegistry(twitterRegistration, twitterRegistryKey);
      
      enqueueSnackbar(`Attempting Transaction...`,{ variant: 'success' });
      const transaction = new Transaction().add(...instruction);
      transaction.recentBlockhash = (
          await connection.getRecentBlockhash("finalized")
      ).blockhash;
      //console.log("Transaction: "+JSON.stringify(transaction));
      transaction.feePayer = publicKey;
      try{
        enqueueSnackbar(`Signing Transaction...`,{ variant: 'success' });
        
        const signature = await sendTransaction(transaction, connection)
        //const signature = await signTransaction(transaction)
        .catch((error: any)=>{
          setLoadingRPC(false);
          throw new Error('Request was not completed! '+error);
        });
        if (!signature){
          setLoadingRPC(false);
          throw new Error('Invalid signature!');
        }else{
          await connection.confirmTransaction(signature, 'processed');
          setTwitterOnChainRegistry(null);
          // check if actually removed...
          const timeout = setTimeout(() => {
            enqueueSnackbar(`Registry deleted...`,{ variant: 'success' });
            checkTwitterRegistration();
            setLoadingRPC(false);
          }, 4000); // added a small delay
          return true;
        }
        return false;
      } catch(e){
        console.log("ERR: "+e);
        setLoadingRPC(false);
        checkTwitterRegistration();
        return false;
      }
    }

  }

  const unlinkTwitter = async () => {
    //await User.updateUser(session, null);
    if (twitterRegistration){
      setLoadingRPC(true);
      console.log("Deleting registry: "+twitterRegistration+" / "+publicKey);
      deregisterTwitterWithConnectedWallet();
    }
  };

  async function checkTwitterRegistration(){
    setLoadingRPC(true);
    getTwitterHandleandRegistryKeyViaFilters(connection, publicKey)
    .then(function(response) {
      if (response){   
        setTwitterRegistry(response[0]);
        setTwitterRegistryKey(response[1]);
        console.log("Found: "+response[0]+" with "+response[1]);
      }
      setLoadingRPC(false);
    })
    .catch(function (error){
      if ("Error: Registry not found."){
        setTwitterRegistry(null);
        setLoadingRPC(false);
      }
      console.log("PROMISE ERR DNS ("+publicKey+"): "+error)
    });
  }

  React.useEffect(() => { 
    if (publicKey && connection){ // use rpc node filtering...
      if (publicKey.toString() == session.publicKey){
        checkTwitterRegistration();
      }
    }
  }, [publicKey]);

  React.useEffect(() => { 
    if (newTwitterRegistration){
      checkTwitterRegistration();
    }
  }, [newTwitterRegistration]);
  
  return (
        <TableRow key={'twitter'}>
          <TableCell component="th" scope="row">
            <Grid container direction="row" alignItems="center">
              <Grid item>
                <TwitterIcon fontSize="large" />
              </Grid>
              <Grid item sx={{ ml: "20px" }}>
                Twitter
              </Grid>
            </Grid>
          </TableCell>
          <TableCell align="right">
          {loadingTwitter ? 
              <>loading registration information...</>
            :
            <>
              {!twitterRegistration && 
                <i>Not registered</i>
              }{twitterRegistration && 
                <>
                  <MakeLinkableAddress addr={`@${twitterRegistration}`} trim={0} hasextlink={false} hascopy={true} isDNS={true} fontsize={12} />
                </>
              }
            </>
          }
          
          </TableCell>
          <TableCell align="right">
          {loadingTwitter ? 
              <Button color="primary" size="small" variant="outlined" disabled={true}><CircularProgress size={24} /></Button>
            :
            <>
              {!twitterRegistration && 
                <>
                <TwitterBoardingDialog setNewTwitterRegistration={setNewTwitterRegistration} /> 
                </>
              }{twitterRegistration && 
                <Tooltip title={`Remove Twitter Registration`}><Button color="primary" size="small" variant="outlined" onClick={unlinkTwitter}><LinkOffIcon/></Button></Tooltip>
              }
            </>
          }
          </TableCell>
        </TableRow>

  )
}