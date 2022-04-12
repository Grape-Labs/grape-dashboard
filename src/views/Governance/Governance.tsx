import { getRealms, getAllProposals, getAllTokenOwnerRecords, getVoteRecordsByVoter, getTokenOwnerRecordForRealm, getTokenOwnerRecordsByOwner, getGovernanceAccounts, pubkeyFilter, TokenOwnerRecord } from '@solana/spl-governance';
import { PublicKey } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import * as React from 'react';
import BN from 'bn.js';
import { styled, useTheme } from '@mui/material/styles';
import {
  Typography,
  Button,
  Grid,
  Box,
  Paper,
  Avatar,
  Skeleton,
  Table,
  TableContainer,
  TableCell,
  TableHead,
  TableBody,
  TableFooter,
  TableRow,
  TablePagination,
  Collapse,
  Tooltip,
  CircularProgress,
  LinearProgress,
} from '@mui/material/';

import {formatAmount, getFormattedNumberToLocale} from '../Meanfi/helpers/ui';

import moment from 'moment';

import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import LastPageIcon from '@mui/icons-material/LastPage';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import TimerIcon from '@mui/icons-material/Timer';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import { PretifyCommaNumber } from '../../components/Tools/PretifyCommaNumber';
import { REALM_ID, GOVERNING_TOKEN, GOVERNANCE_PROGRAM_ID } from '../../components/Tools/constants';
import { token } from '@project-serum/anchor/dist/cjs/utils';

import PropTypes from 'prop-types';

const StyledTable = styled(Table)(({ theme }) => ({
    '& .MuiTableCell-root': {
        borderBottom: '1px solid rgba(255,255,255,0.05)'
    },
}));

const GOVERNANNCE_STATE = {
    0:'Draft',
    1:'Signing Off',
    2:'Voting',
    3:'Succeeded',
    4:'Executing',
    5:'Completed',
    6:'Cancelled',
    7:'Defeated',
    8:'Executing with Errors!',
}

TablePaginationActions.propTypes = {
    count: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired,
    page: PropTypes.number.isRequired,
    rowsPerPage: PropTypes.number.isRequired,
};

function TablePaginationActions(props) {
    const theme = useTheme();
    const { count, page, rowsPerPage, onPageChange } = props;
  
    const handleFirstPageButtonClick = (event) => {
        onPageChange(event, 0);
    };

    const handleBackButtonClick = (event) => {
        onPageChange(event, page - 1);
    };
  
    const handleNextButtonClick = (event) => {
        onPageChange(event, page + 1);
    };
  
    const handleLastPageButtonClick = (event) => {
        onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
    };
    
    return (
        <Box sx={{ flexShrink: 0, ml: 2.5 }}>
            <IconButton
                onClick={handleFirstPageButtonClick}
                disabled={page === 0}
                aria-label="first page"
            >
                {theme.direction === "rtl" ? <LastPageIcon /> : <FirstPageIcon />}
            </IconButton>
            <IconButton
                onClick={handleBackButtonClick}
                disabled={page === 0}
                aria-label="previous page"
            >
                {theme.direction === "rtl" ? (
                    <KeyboardArrowRight />
                ) : (
                    <KeyboardArrowLeft />
                )}
            </IconButton>
            <IconButton
                onClick={handleNextButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="next page"
            >
                {theme.direction === "rtl" ? (
                    <KeyboardArrowLeft />
                ) : (
                    <KeyboardArrowRight />
                )}
            </IconButton>
            <IconButton
                onClick={handleLastPageButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="last page"
            >
                {theme.direction === "rtl" ? <FirstPageIcon /> : <LastPageIcon />}
            </IconButton>
        </Box>
    );
  }

function RealmProposals(props:any) {
    const [loading, setLoading] = React.useState(false);
    const [proposals, setProposals] = React.useState(null);
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const realm = props.realm;
    const dao = props.dao;

    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    // Avoid a layout jump when reaching the last page with empty rows.
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - proposals.length) : 0;

    const handleChangePage = (event:any, newPage:number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event:any) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const getProposals = async () => {
        if (!loading){
            setLoading(true);
            try{
            
                const programId = new PublicKey(GOVERNANCE_PROGRAM_ID);
                const gprops = await getAllProposals(connection, programId, realm);
                // Arrange
                //expect(proposals.length).toBeGreaterThan(0);
                
                let allprops: any[] = [];
                for (let props of gprops){
                    for (let prop of props){
                        var jprs = JSON.parse(JSON.stringify(prop));
                        if (prop){
                            if (jprs.account?.votingAt){
                                allprops.push(prop);
                                //console.log("Pushing: "+JSON.stringify(prop));
                            }
                        }
                    }
                }
                // sort by date! 
                allprops.sort((a,b) => (a.account?.votingAt.toNumber() < b.account?.votingAt.toNumber()) ? 1 : -1);

                // then set props
                setProposals(allprops);
                //console.log("Proposals ("+realm+"): "+JSON.stringify(gprops[0]));
            }catch(e){console.log("ERR: "+e)}
        }
        setLoading(false);
    }

    React.useEffect(() => { 
        if (publicKey && !loading && realm)
            getProposals();
    }, [realm]);

    if(loading){
        return (
            <Box sx={{ width: '100%' }}>
                <LinearProgress sx={{borderRadius:'10px;'}} />
            </Box>
            
        )
    }

        return (
            <Table>
                <TableContainer component={Paper} sx={{background:'none'}}>
                    <StyledTable sx={{ minWidth: 500 }} size="small" aria-label="Portfolio Table">
                        <TableHead>
                            <TableRow>
                                <TableCell><Typography variant="caption">Name</Typography></TableCell>
                                <TableCell align="center" sx={{width:"1%"}}><Typography variant="caption">Yes</Typography></TableCell>
                                <TableCell align="center" sx={{width:"1%"}}><Typography variant="caption">No</Typography></TableCell>
                                <TableCell align="center" sx={{width:"1%"}}><Typography variant="caption"></Typography></TableCell>
                                <TableCell align="center"><Typography variant="caption">Ending</Typography></TableCell>
                                <TableCell align="center"><Typography variant="caption">Vote</Typography></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {/*proposals && (proposals).map((item: any, index:number) => (*/}
                            {proposals && 
                            <>  
                                {(rowsPerPage > 0
                                    ? proposals.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    : proposals
                                ).map((item:any, index:number) => (
                                <>
                                    {item?.pubkey && item?.account &&
                                        <TableRow key={index} sx={{borderBottom:"none"}}>
                                            <TableCell>
                                                {item.account?.name}
                                                {item.account?.descriptionLink && 
                                                    <Tooltip title={item.account?.descriptionLink}>
                                                        <Button sx={{ml:1}}><HelpOutlineIcon sx={{ fontSize:16 }}/></Button>
                                                    </Tooltip>
                                                }
                                            </TableCell>
                                            <TableCell>
                                                {item.account?.options[0].voteWeight && 
                                                    <Typography variant="caption">
                                                        <Tooltip title={`${(((item.account?.options[0].voteWeight.toNumber()/1000000)/((item.account?.denyVoteWeight.toNumber()/1000000)+(item.account?.options[0].voteWeight.toNumber()/1000000)))*100).toFixed(2)}%`}>
                                                            <Button sx={{fontSize:'12px',color:'white'}}>
                                                                {`${(item.account?.options[0].voteWeight.toNumber()/1000000).toFixed(0)}`}
                                                            </Button>
                                                        </Tooltip>
                                                    </Typography>
                                                }
                                            </TableCell>
                                            <TableCell>
                                                {item.account?.denyVoteWeight && 
                                                    <Typography variant="caption">
                                                        <Tooltip title={`${(((item.account?.denyVoteWeight.toNumber()/1000000)/((item.account?.denyVoteWeight.toNumber()/1000000)+(item.account?.options[0].voteWeight.toNumber()/1000000)))*100).toFixed(2)}%`}>
                                                            <Button sx={{fontSize:'12px',color:'white'}}>
                                                                {`${(item.account?.denyVoteWeight.toNumber()/1000000).toFixed()}`}
                                                            </Button>
                                                        </Tooltip>
                                                    </Typography>
                                                }
                                            </TableCell>
                                            <TableCell  align="center">
                                                <Typography variant="caption">
                                                    {GOVERNANNCE_STATE[item.account?.state]}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography variant="caption">
                                                    {item.account?.votingCompletedAt ?
                                                    (
                                                        <Tooltip title={`Started: ${item.account?.votingAt && (moment.unix((item.account?.votingAt).toNumber()).format("MMMM Da, YYYY, h:mm a"))} - Ended: ${item.account?.votingAt && (moment.unix((item.account?.votingCompletedAt).toNumber()).format("MMMM Da, YYYY, h:mm a"))}`}>
                                                            <Button sx={{fontSize:'12px',color:'white'}}>
                                                                {item.account?.votingAt && (moment.unix((item.account?.votingCompletedAt).toNumber()).format("MMMM D, YYYY"))}
                                                            </Button>
                                                        </Tooltip>
                                                    ): (<>
                                                        { item.account?.state === 2 ?
                                                            <Tooltip title={`Started: ${item.account?.votingAt && (moment.unix((item.account?.votingAt).toNumber()).format("MMMM Da, YYYY, h:mm a"))}`}>
                                                                <Button sx={{fontSize:'12px',color:'white'}}>
                                                                    <TimerIcon sx={{ fontSize:"small"}} />
                                                                </Button>
                                                            </Tooltip>
                                                        : 
                                                            <Tooltip title={`Started: ${item.account?.votingAt && (moment.unix((item.account?.votingAt).toNumber()).format("MMMM Da, YYYY, h:mm a"))}`}>
                                                                <Button sx={{fontSize:'12px',color:'white'}}>
                                                                    <CancelOutlinedIcon sx={{ fontSize:"small", color:"red"}} />
                                                                </Button>
                                                            </Tooltip>
                                                        }
                                                        </>
                                                    )}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {item.account?.votingCompletedAt ?
                                                (
                                                    <Tooltip title="View Vote Results">
                                                        <Button sx={{color:'white'}} href={`https://realms.today/dao/${dao}/proposal/${item?.pubkey}`} target='_blank'><OpenInNewIcon sx={{ fontSize:"12px"}} /></Button>
                                                    </Tooltip>
                                                ):(
                                                    <Tooltip title="Participate &amp; Cast your Vote">
                                                        <Button sx={{color:'white'}} href={`https://realms.today/dao/${dao}/proposal/${item?.pubkey}`} target='_blank'><HowToVoteIcon /></Button>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    }
                                </>

                            ))}
                            {/*emptyRows > 0 && (
                                <TableRow style={{ height: 53 * emptyRows }}>
                                    <TableCell colSpan={5} />
                                </TableRow>
                            )*/}
                            </>
                            }
                        </TableBody>
                        
                        <TableFooter>
                            <TableRow>
                                <TablePagination
                                rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
                                colSpan={5}
                                count={proposals && proposals.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                SelectProps={{
                                    inputProps: {
                                    'aria-label': 'rows per page',
                                    },
                                    native: true,
                                }}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                ActionsComponent={TablePaginationActions}
                                />
                            </TableRow>
                        </TableFooter>
                        
                        
                    </StyledTable>
                </TableContainer>
            </Table>
        )
}

export function GovernanceView(props: any) {
    const [loading, setLoading] = React.useState(false);
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [realms, setRealms] = React.useState(null);
    const [voteRecords, setVoteRecords] = React.useState(null);
    const [tokenOwnerRecords, setOwnerRecords] = React.useState(null);
    const [tokenOwnerRecordsByOwner, setOwnerRecordsByOwner] = React.useState(null);

    const getGovernance = async () => {
        if (!loading){
            setLoading(true);
            try{
                const programId = new PublicKey(GOVERNANCE_PROGRAM_ID);
                
                const realmId = new PublicKey(REALM_ID);
                const governingTokenMint = new PublicKey(GOVERNING_TOKEN); // Grape Mint
                const governingTokenOwner = publicKey;

                const rlms = await getRealms(connection, programId);
                const uTable = rlms.reduce((acc, it) => (acc[it.pubkey.toBase58()] = it, acc), {})
                setRealms(uTable);

                const ownerRecordsbyOwner = await getTokenOwnerRecordsByOwner(connection, programId, governingTokenOwner);
                setOwnerRecordsByOwner(ownerRecordsbyOwner);
            
            }catch(e){console.log("ERR: "+e)}
        } else{

        }
        setLoading(false);
    }

    function GovernanceRow(props: any) {
        const item = props.item;
        const index = props.index;
        const realm = props.realm;
        const tokenOwnerRecord = props.tokenOwnerRecord;
        const [open, setOpen] = React.useState(false);
        
        return (
            <React.Fragment>
                    <TableRow key={index} sx={{borderBottom:"none"}}>
                        
                        <TableCell sx={{width:"1%"}}>
                            <IconButton
                                aria-label="expand row"
                                size="small"
                                onClick={() => setOpen(!open)}
                            >
                                {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                        </TableCell>
                        <TableCell align='left' style={{ verticalAlign: 'middle' }}>  
                            <Grid container direction="row" alignItems="center" sx={{ }}>
                                <Grid item>
                                    {tokenOwnerRecordsByOwner[index].account.governingTokenMint.toBase58() === GOVERNING_TOKEN ? (
                                        <Avatar 
                                            component={Paper} 
                                            elevation={4}
                                            alt={realm.account?.name || tokenOwnerRecordsByOwner[index].account.governingTokenMint.toBase58()} 
                                            src={'https://lh3.googleusercontent.com/y7Wsemw9UVBc9dtjtRfVilnS1cgpDt356PPAjne5NvMXIwWz9_x7WKMPH99teyv8vXDmpZinsJdgiFQ16_OAda1dNcsUxlpw9DyMkUk=s0'}
                                            sx={{ width: 28, height: 28, bgcolor: "#222" }}
                                        />
                                    ):(
                                        <Avatar 
                                            component={Paper} 
                                            elevation={4}
                                            alt={realm.account?.name || tokenOwnerRecordsByOwner[index].account.governingTokenMint.toBase58()} 
                                            sx={{ width: 28, height: 28, bgcolor: "#222" }}
                                        >{realm.account?.name.substring(0,1) || tokenOwnerRecordsByOwner[index].account.governingTokenMint.toBase58().substring(0,1)}</Avatar>
                                    )}
                                </Grid>
                                <Grid item sx={{ ml: 1 }}>
                                    <Tooltip title={`Realm: ${tokenOwnerRecord.account.realm.toBase58()}`}>
                                        <Button  sx={{color:'white'}} href={`https://realms.today/dao/${tokenOwnerRecordsByOwner[index].account.realm.toBase58()}`} target='_blank'>
                                            {realm.account?.name || tokenOwnerRecordsByOwner[index].account.governingTokenMint.toBase58()}
                                        </Button>
                                    </Tooltip>
                                </Grid>
                            </Grid>
                        </TableCell>
                        <TableCell align="right">{getFormattedNumberToLocale(formatAmount((parseInt(tokenOwnerRecordsByOwner[index].account?.governingTokenDepositAmount, 10))/1000000))}</TableCell>                     
                    </TableRow>
    
                    <TableRow key={`r-${index}`}>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7} align="center">
                            <Collapse in={open} timeout="auto" unmountOnExit>
                                <Box sx={{ margin: 1 }}>
                                    {/*
                                    <Typography variant="h6" gutterBottom component="div">
                                        Address
                                    </Typography>
                                    */}
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <RealmProposals dao={tokenOwnerRecordsByOwner[index].account.realm.toBase58()} realm={tokenOwnerRecord.account.realm} />
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Collapse>
                        </TableCell>
                    </TableRow>
            </React.Fragment>
        );
    }
    
    React.useEffect(() => { 
        if (publicKey && !loading)
            getGovernance();
    }, [publicKey]);
    
    if(loading){
        return (
            <React.Fragment>
                <Grid item xs={12}>
                    <Paper className="grape-paper-background">
                        <Paper
                        className="grape-paper"
                        sx={{
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                        >
                            <Box sx={{ p:1, width: "100%" }}>
                                <Skeleton />
                            </Box>
                        </Paper>
                    </Paper>
                </Grid>
            </React.Fragment>
        )
    } else{
        if (tokenOwnerRecordsByOwner && realms){
            return (
                <React.Fragment>
                    <Grid item xs={12} md={12} lg={12}>
                        <Paper className="grape-paper-background">
                            <Box className="grape-paper">
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box className="grape-dashboard-component-header" sx={{ m: 0, position: 'relative' }}>
                                        <Typography gutterBottom variant="h6" component="div" sx={{ m: 0, position: 'relative'}}>
                                        GOVERNANCE
                                        </Typography>
                                    </Box>
                                </Box>
                                
                                <TableContainer>
                                    <StyledTable sx={{ minWidth: 500 }} size="small" aria-label="Governance Table">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell></TableCell>
                                                <TableCell><Typography variant="caption">Realm</Typography></TableCell>
                                                <TableCell align="right"><Typography variant="caption">Votes</Typography></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {tokenOwnerRecordsByOwner && Object.keys(tokenOwnerRecordsByOwner).map((item: any, index:number) => (
                                                <>
                                                    <GovernanceRow item={item} index={index} realm={realms[tokenOwnerRecordsByOwner[item].account.realm.toBase58()]} tokenOwnerRecord={tokenOwnerRecordsByOwner[item]}/>
                                                </>
                                            ))}
                                        </TableBody>
                                    </StyledTable>
                                </TableContainer>
                                
                            </Box>
                        </Paper>
                    </Grid>
                </React.Fragment>
            );
        }else{
            return (<></>);
        }
        
    }
}