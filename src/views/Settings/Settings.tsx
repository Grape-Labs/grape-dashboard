import React, { useState, useEffect, ReactElement } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Tabs,
  Tab,
  Box,
  Paper,
  Typography,
  Grid,
  Tooltip,
  Dialog,
  DialogProps,
  IconButton,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material/';

import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { makeStyles, styled, alpha } from '@mui/material/styles';

import { useWallet } from '@solana/wallet-adapter-react';
//import { TwitterSettings } from "./TwitterSettingsCardinal";
import { TwitterSettings } from "./TwitterSettingsBonfida";
import { useSession } from "../../contexts/session";
import User from '../../models/User';
import DiscordIcon from '../../components/StaticIcons/DiscordIcon';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { MakeLinkableAddress, ValidateAddress } from '../../components/Tools/WalletAddress'; // global key handling

import CloseIcon from '@mui/icons-material/Close';

const StyledTable = styled(Table)(({ theme }) => ({
  '& .MuiTableCell-root': {
      borderBottom: '1px solid rgba(255,255,255,0.05)'
  },
}));

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

export const SettingsView = (props:any) => {
  const [tab, setTab] = useState<number>(0);
  const { session, setSession } = useSession();
  const [discord, setDiscord] = useState(null);
  const [twitter, setTwitter] = useState(null);
  //const isConnected = session && session.isConnected;
  const wallets = session && session.userWallets;
  const userId = session && session.userId;
  const endpoint = props.endpoint;
  const { publicKey, wallet, disconnect } = useWallet();
  
  React.useEffect(() => {
    const discordId = session && session.discordId;
    setDiscord(discordId);
  }, [session]);

  React.useEffect(() => {
    if (!discord){
      //promptConnect();
    }
  }, [discord]);

  const handleChange = (_event: any, newValue: number) => {
    setTab(newValue);
  };

  const unlinkDiscord = async () => {
    await User.updateUser(session, null);
    session.discordId = null;
    setSession(session);
    setDiscord(null);
  };

  const unlinkTwitter = async () => {
    session.twitterId = null;
    setSession(session);
    setTwitter(null);
  };

  const disconnectWallet = async () => {
    disconnect();
  }

  return (
    <React.Fragment>
      <Grid item xs={12} md={12} lg={12}>
        <Paper className="grape-paper-background">
            <Box
              className="grape-paper"
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box className="grape-dashboard-component-header" sx={{ m: 0, position: 'relative' }}>
                  <Typography gutterBottom variant="h6" component="div" sx={{ m: 0, position: 'relative'}}>
                    SETTINGS
                  </Typography>
                </Box>
              </Box>
              <React.Fragment>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tab} onChange={handleChange} aria-label="Server Tabs">
                      <Tab label="Accounts" />
                      <Tab label="Wallets" />
                    </Tabs>
                  </Box>

                  {tab === 0 && 
                    <TableContainer>
                      <StyledTable aria-label="simple table" size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell align="left"><Typography variant="caption">Provider</Typography></TableCell>
                            <TableCell align="right"><Typography variant="caption">ID</Typography></TableCell>
                            <TableCell align="right"><Typography variant="caption">Actions</Typography></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow key={'discord'}>
                            <TableCell component="th" scope="row">
                              <Grid container direction="row" alignItems="center">
                                  <Grid item>
                                    <DiscordIcon fontSize="large" />
                                </Grid>
                                <Grid item style={{ marginLeft: "20px" }}>
                                  Discord
                                </Grid>
                              </Grid>
                            </TableCell>
                            <TableCell align="right">{discord || <i>Not linked</i>}</TableCell>
                            <TableCell align="right">
                              {!discord && 
                                <Tooltip title={`Link Discord`}><Button href={`https://verify.grapes.network/start`} color="primary" size="small" variant="contained"><LinkIcon sx={{mr:1}}/> Link Discord</Button></Tooltip>
                              }{discord && 
                                <Tooltip title={`Unlink Discord`}><Button color="primary" size="small" variant="outlined" onClick={unlinkDiscord}><LinkOffIcon/></Button></Tooltip>
                              }
                            </TableCell>
                          </TableRow>

                          <TwitterSettings />
                          
                        </TableBody>
                      </StyledTable>
                    </TableContainer>
                  }
                  {tab === 1 && 
                    <TableContainer>
                      <StyledTable aria-label="simple table">
                        <TableHead>
                          <TableRow>
                            <TableCell align="left"><Typography variant="caption">Address</Typography></TableCell>
                            <TableCell align="right"><Typography variant="caption">Actions</Typography></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {wallets.map(mapwallet => {
                            return (
                              <TableRow>
                                <TableCell component="th" scope="row">
                                  <MakeLinkableAddress addr={mapwallet.address} trim={0} hasextlink={true} hascopy={true} fontsize={16} />
                                </TableCell>
                                <TableCell align="right">
                                {publicKey.toString() === mapwallet.address && 
                                  <Button color="primary" size="small" variant="contained" title="Connect" disabled>Current</Button>
                                }
                                </TableCell>
                              </TableRow>
                          )})}
                          <TableRow>
                            <TableCell component="th" scope="row">
                              
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title={`Add Wallet`}>
                                <Button href={`https://verify.grapes.network/start`} color="primary" size="small" variant="contained"
                                  onClick={disconnectWallet}
                                >
                                  <AddCircleOutlineOutlinedIcon sx={{mr:1}}/> Wallet</Button>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </StyledTable>
                    </TableContainer>
                  }
                </React.Fragment>
          </Box>
        </Paper>
      </Grid>
    </React.Fragment>
  );
}

