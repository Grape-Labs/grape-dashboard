import React, { FC, ReactNode, useCallback, useMemo } from 'react';
import { styled, ThemeProvider } from '@mui/material/styles';
import { HashRouter, BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { 
  HomeView, 
  ServersView, 
  SettingsView, 
  ConfirmationView, 
  RegisterView, 
  NewsView, 
  GrapePartnersView,
  MembershipView, 
  ContributeView, 
  PaymentsView,
  MeanfiView } from "./views";
import { SessionProvider } from "./contexts/session";
import CssBaseline from '@mui/material/CssBaseline';
import MuiDrawer from '@mui/material/Drawer';

import {
  Box,
  Grid,
  Paper,
  Container,
  Typography,
  AppBar,
} from '@mui/material';

import Header from './components/Header/Header';
import { SnackbarProvider } from 'notistack';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { Helmet } from 'react-helmet';

import { useSnackbar } from 'notistack';
import ConfirmDialog from './components/ConfirmDialog/ConfirmDialog';

//import { WalletDialogProvider, WalletDisconnectButton, WalletMultiButton } from '../WalletAdapterMui';


import {
  GlowWalletAdapter,
  //LedgerWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  SolletExtensionWalletAdapter,
  SolletWalletAdapter,
  BraveWalletAdapter,
  TokenPocketWalletAdapter,
  TorusWalletAdapter,
  CloverWalletAdapter,
  ExodusWalletAdapter,
  //MathWalletAdapter,
  //Coin98WalletAdapter,
  //SolongWalletAdapter,
} from '@solana/wallet-adapter-wallets';

//import { mainListItems, secondaryListItems } from './components/SidebarList/SidebarList';
import grapeTheme from  './config/theme'
import "./App.less";
import { GRAPE_RPC_ENDPOINT, TX_RPC_ENDPOINT } from './components/Tools/constants';

function Copyright(props: any) {
  return (
    <Typography sx={{background:'transparent'}} variant="body2" color="text.secondary" align="center" {...props}>
      Grape Network
      {/*
      <Link color="inherit" href="https://verify.grapes.network">
        Grape Network | Dashboard vXYZ
      </Link>
      */}
    </Typography>
  );
}

const drawerWidth: number = 240;

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    '& .MuiDrawer-paper': {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: 'border-box',
      ...(!open && {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
          width: theme.spacing(9),
        },
      }),
    },
  }),
);


function DashboardContent() {
  const [open, setOpen] = React.useState(true);
  const toggleDrawer = () => {
    setOpen(!open);
  };

  // You can also provide a custom RPC endpoint
  const network = WalletAdapterNetwork.Mainnet; //.Devnet; //.Mainnet;
  // You can also provide a custom RPC endpoint
  const endpoint = GRAPE_RPC_ENDPOINT; //useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(() => [
    new GlowWalletAdapter(),
    new PhantomWalletAdapter(),
    new SlopeWalletAdapter(),
    new SolflareWalletAdapter(),
    new ExodusWalletAdapter(),
    new TorusWalletAdapter(),
    //new LedgerWalletAdapter(),
    new SolletWalletAdapter({ network }),
    new SolletExtensionWalletAdapter({ network }),
    new BraveWalletAdapter(),
    new TokenPocketWalletAdapter(),
    new CloverWalletAdapter(),
    //new MathWalletAdapter(),
    //new Coin98WalletAdapter(),
    //new SolongWalletAdapter(),
  ], [network]);

  return (
    <>
    <Helmet>
      <title>Grape Dashboard</title>
      <meta name="theme-color" content="#ffffff" />
      <meta name="description" content="Grape Dashboard" />
      
      <meta name="msapplication-TileColor" content="#da532c"/>
      <meta name="theme-color" content="#ffffff"/>

      <meta property="og:url" content="https://verify.grapes.network/"/>
      <meta property="og:type" content="website"/>
      <meta property="og:title" content="Grape Network | The Grape Ape Network"/>
      <meta property="og:description" content="Decentralized Social Networking Create, Reward &amp; Secure any online community by harnessing the power of Solana"/>
      <meta property="og:image" content="/grape_og.png"/>

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content='https://verify.grapes.network' />
      <meta name="twitter:title" content='Grape Network' />
      <meta name="twitter:description" content='' />
      <meta name="twitter:image" content='/grape_og.png' />
    </Helmet>
    <ThemeProvider theme={grapeTheme}>
      <SnackbarProvider>
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
              
              <Grid 
                //color={grapeTheme.palette.primary.light}
                sx={{ 
                  flex: 1
                }}>
                <CssBaseline />
                <HashRouter>
                  <SessionProvider>
                    <AppBar position="fixed" color="primary" style={{ background: 'rgba(0,0,0,0.5)' }}>
                        <Header
                            open={open} 
                            toggleDrawer={toggleDrawer}
                        />

                      </AppBar>
                      
                      <Grid
                        component="main"
                        sx={{
                          mt: 6,
                          display: 'flex',
                          flexGrow: 1
                        }}
                      >
                        <Container maxWidth="lg" sx={{ mt: 4, mb: 4}}>
                          <ConfirmDialog />
                          <Routes>
                            <Route path="/" element={<HomeView/>} />
                            <Route index element={<HomeView/>} />
                            <Route path="dashboard" element={<HomeView/>} />
                            <Route path="contribute" element={<ContributeView />} />
                            <Route path="streams" element={<MeanfiView />} />
                            <Route path="servers" element={<ServersView />} />
                            <Route path="settings" element={<SettingsView />} />
                            <Route path="partners" element={<GrapePartnersView />} />
                            <Route path="confirmation" element={<ConfirmationView />} />
                            <Route path="register" element={<RegisterView />} />
                            <Route path="membership" element={<MembershipView />} />
                            <Route path="news" element={<NewsView />} />
                            <Route path="payments" element={<PaymentsView />} />
                            <Route path="*" element={<NotFound/>} />
                          </Routes>
                          
                          <Copyright sx={{ mt: 4 }} />
                        </Container>
                      </Grid>
                  </SessionProvider>
                </HashRouter>
              </Grid>
              
            </WalletProvider>
          </ConnectionProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </>
  );
}

export const NotFound = () => {
  return (
    <>
      <Paper className="grape-paper-background">
        <Grid 
          className="grape-paper" 
          container
          alignContent="center"
          justifyContent="center"
          direction="column">
          <Grid item>
            <Typography 
              align="center"
              variant="h3">
              {'No Grapes Here...'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
  </>
  )
}

//export const Dashboard: FC<{ children: ReactNode }> = ({ children }) => {
export default function Dashboard() {
  return <DashboardContent />;
}