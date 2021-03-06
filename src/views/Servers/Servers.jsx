import * as React from 'react';
import { useState, useEffect } from "react";
import { useSession } from "../../contexts/session";
import UserServer from '../../models/UserServer';
import TwitterFeed from '../Feed/TwitterFeed';
import PropTypes from 'prop-types';
import { visuallyHidden } from '@mui/utils';
import MUIDataTable from "mui-datatables";

import {
  Grid,
  Typography,
  Collapse,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableContainer,
  TableSortLabel,
  TableRow,
  TableFooter,
  TablePagination,
  Tooltip,
  Paper,
  Box,
  Avatar,
} from '@mui/material';

import { makeStyles, styled, alpha, useTheme } from '@mui/material/styles';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import IconButton from '@mui/material/IconButton';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import LastPageIcon from '@mui/icons-material/LastPage';

const StyledTable = styled(Table)(({ theme }) => ({
  '& .MuiTable-root': {
    background: 'none', 
  },
  '& .MuiPaper-root': {
    background: 'none', 
  },
  '& .MuiToolbar-root': {
    height:'44px',
    minHeight:'44px!important'
  },
  '& .MuiTableRow-root': {
    height: '10px', 
  },
  '& .MuiAvatar-circular.MuiPaper-root': {
    background: '#333', 
  },
  '& .MuiTableCell-root.MuiTableCell-body': {
    lineHeight:'1.25em',
    padding:4
  },
  '& .MuiTableCell-root.MuiTableCell-head': {
    lineHeight:'1.25em',
    padding:4
  },
  '& .MuiTableCell-root': {
    background: 'none', 
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
}));

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// This method is created for cross-browser compatibility, if you don't
// need to support IE11, you can use Array.prototype.sort() directly
function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

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

TablePaginationActions.propTypes = {
  count: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
};

function ServerRow(props) {
  const { token, index } = props;
  const [open, setOpen] = React.useState(false);
  const labelId = props.labelId;
  const server = props.server;
  const indexus = props.indexus;
  const unregister = props.unregister;

  return (
      <React.Fragment>
        <TableRow key={server.name}>
          <TableCell align="left">
              <Avatar component={Paper} 
                  elevation={4}
                  alt={server.name} 
                  src={`/server-logos/${server.logo}`}
                  sx={{ width: 30, height: 30, bgcolor: "#333",ml:1 }}
              />
          </TableCell>
          <TableCell id={labelId}>
            <Button color="secondary" href={`${server.url}`} target="_blank">{server.name}</Button>
            {server?.twitter &&
              <IconButton
                  aria-label="expand row"
                  size="small"
                  onClick={() => setOpen(!open)}
              >
                  {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
              </IconButton>
            }
          </TableCell>
          <TableCell align="right">
            <Tooltip title={`Unregister ${server.name}`}><Button color="error" size="small" variant="outlined" onClick={() => unregister(server.serverId, indexus)} sx={{mr:1}}><RemoveCircleOutlineIcon/></Button></Tooltip>
          </TableCell>
        </TableRow>
        {server?.twitter &&
          <TableRow key={server.name}>
              <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                  <Collapse in={open} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 1 }}>
                          {/*
                          <Typography variant="h6" gutterBottom component="div">
                              Address
                          </Typography>
                          */}
                          <Table size="small" aria-label="purchases">
                              <TableHead>
                                  <TableRow>
                                      <TableCell align="center" sx={{borderBottom:"none"}}>
                                        Fetching {server.twitter}
                                        <TwitterFeed title={`${server.name} Feed`} twitterhandle={server.twitter} twitterheight={400} twitterelements={2} componentTwitterFeed={false} />
                                      </TableCell>
                                  </TableRow>
                              </TableHead>
                          </Table>
                      </Box>
                  </Collapse>
              </TableCell>
          </TableRow>
          }
      </React.Fragment>
  );
}

export const ServersView = (props) => {
  const [orderT1, setOrderT1] = React.useState('asc');
  const [orderByT1, setOrderByT1] = React.useState('server.name');
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('server.name');
  const [tab, setTab] = useState(0);
  const { session, setSession } = useSession();
  const [searched, setSearched] = useState('');
  
  const [servers, setServers] = useState([]);
  const [userServers, setUserServers] = useState([]);

  const [rowsPerPageT1, setRowsPerPageT1] = React.useState(5);
  const [rowsPerPageT2, setRowsPerPageT2] = React.useState(10);
  const [pageT1, setPageT1] = React.useState(0);
  const [pageT2, setPageT2] = React.useState(0);
  const emptyRowsT1 = rowsPerPageT1 - Math.min(rowsPerPageT1, userServers.length - pageT1 * rowsPerPageT1);
  const emptyRowsT2 = rowsPerPageT2 - Math.min(rowsPerPageT2, servers.length - pageT2 * rowsPerPageT2);

  const handleChangePageT1 = (event, newPage) => {
    setPageT1(newPage);
  };

  const handleChangeRowsPerPageT1 = (event) => {
    setRowsPerPageT1(parseInt(event.target.value, 10));
    setPageT1(0);
  };

  const handleChangePageT2 = (event, newPage) => {
    setPageT2(newPage);
  };

  const handleChangeRowsPerPageT2 = (event) => {
    setRowsPerPageT2(parseInt(event.target.value, 10));
    setPageT2(0);
  };

  const register = async (serverId) => {
    //console.log("SESSION: "+JSON.stringify(session))
    //console.log("ServerId: "+JSON.stringify(serverId))

    let userServer = await UserServer.register(session, serverId);
    session.userServers.push(userServer);
    setSession(session);
    setTab(0);
  };

  const unregister = async (serverId, index) => {
    let response = await UserServer.unregister(session, serverId);
    if (response) {
      let userServers = [...session.userServers];
      userServers.splice(index, 1);
      session.userServers = userServers;
      setSession(session);
      setUserServers(userServers);
      setServers(session.servers);
    }
  };

  const handleChange = (_event, newValue) => {
    setTab(newValue);
  };

  const handleRequestSortT1 = (event, property) => {
    const isAsc = orderByT1 === property && orderT1 === 'asc';
    setOrderT1(isAsc ? 'desc' : 'asc');
    setOrderByT1(property);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const createSortHandlerT1 = (property) => (event) => {
    handleRequestSortT1(event, property);
  };
  const createSortHandler = (property) => (event) => {
    handleRequestSort(event, property);
  };

  useEffect(() => {
    let servers = session && session.servers;
    const userServers = session && session.userServers;

    if (servers && userServers) {
      let userServerIds = new Map();

      userServers.forEach(userServer => {
        userServerIds.set(userServer.serverId, true);
      });

      let newServers = servers.map(server => {
        server.registered = userServerIds.get(server.serverId) || false;

        return server;
      });

      setServers(newServers);
      setUserServers(userServers);
    }

  }, [session]);

  const servercolumns = [
    {
      name:"logo",
      label:"Org Logo",
      options: {
        filter: true,
        sort: true,
        display: false,
        //customHeadRender: ()=>null
       }
    },
    {
      name:"name",
      label:"Org Name",
      options: {
        filter: false,
        sort: false,
        display: false,
       }
    },
    {
      name:"url",
      label:"Org Url",
      options: {
        filter: false,
        sort: false,
        display: false,
       }
    },
    {
      name: "name",
      label:"Name",
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value, tableMeta, updateValue) => {
            //console.log(tableMeta.rowData, '......');
            return (
              <Grid container direction="row" alignItems="center">
                <Grid item>
                  <Avatar component={Paper} 
                      elevation={4}
                      alt={tableMeta.rowData[1]}
                      src={`/server-logos/${tableMeta.rowData[0]}`}
                      sx={{ width: 30, height: 30, bgcolor: "#333", ml:1 }}
                  />
                </Grid>
                <Grid item>
                <Button color="secondary" href={`${tableMeta.rowData[2]}`} target="_blank">{tableMeta.rowData[1]}</Button>
                </Grid>
              </Grid>
            );
        }
      }
    },
    {
      name:"serverId",
      label:"Actions",
      options: {
        filter: false,
        sort: false,
        align: "right",
        style: "",
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <Tooltip title={`Register ${tableMeta.rowData[1]}`}><Button color="primary" size="small" variant="contained" onClick={() => register(value)} sx={{mr:1}}><AddCircleOutlineIcon /></Button></Tooltip>
          )           
        },
        setCellProps: () => ({
          align: "right"
        }),
        setCellHeaderProps: () => ({
          align: "right"
        })
       }
    }];
  const serveroptions = {
    responsive:"scroll",
    selectableRows: false,
    download:false,
    print:false,
    viewColumns:false,
    filter:false
  };

  return (
    <React.Fragment>
      <Grid item xs={12} md={12} lg={12}>
        <Paper class="grape-paper-background">
            <Box
              class="grape-paper"
            >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box class="grape-dashboard-component-header" sx={{ m: 0, position: 'relative' }}>
                <Typography gutterBottom variant="h6" component="div" sx={{ m: 0, position: 'relative'}}>
                  SERVERS
                </Typography>
              </Box>
            </Box>
            <React.Fragment> 
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tab} onChange={handleChange} aria-label="Server Tabs">
                  <Tab label="Registered" />
                  <Tab label="All" />
                </Tabs>

                {/*
                <Search>
                    <SearchIconWrapper>
                    <SearchIcon />
                    </SearchIconWrapper>
                    <StyledInputBase
                        placeholder="Search by Wallet"
                        //autoFocus
                        autoComplete='off'
                        margin="dense"
                        id="collection_wallet_id"
                        type="text"
                        value={walletPKId}
                        onChange={(e) => requestSearch(e.target.value)}
                        inputProps={{ 'aria-label': 'search' }}
                        onKeyDown={(e) => {
                            console.log(`Pressed keyCode ${e.key}`);
                            if (e.key === 'Enter') {
                                if (ValidateAddress(walletPKId)){
                                    HandlePKSubmit(e);
                                }
                            }
                        }}
                    />
                </Search>
                */}
              </Box>

              {tab === 0 && 
                <React.Fragment>
                  <TableContainer>
                    <StyledTable sx={{ minWidth: 500}} size="small" aria-label="Servers Table">
                      <TableHead sx={{p:1}}>
                        <TableRow>
                          <TableCell 
                              align="left" 
                              sx={{ width: '1%' }}
                              key={'name'}
                              //align={headCell.numeric ? 'right' : 'left'}
                              //padding={headCell.disablePadding ? 'none' : 'normal'}
                              sortDirection={orderByT1 === 'name}' ? orderT1 : false}
                            >
                              <TableSortLabel
                                active={orderByT1 === 'name'}
                                direction={orderByT1 === 'name' ? orderT1 : 'asc'}
                                onClick={createSortHandlerT1('name')}
                              >
                                <Typography variant="caption" sx={{ml:1}}>Name</Typography>
                                {orderByT1 === 'name}' ? (
                                  <Box component="span" sx={visuallyHidden}>
                                    {orderT1 === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                  </Box>
                                ) : null}
                              </TableSortLabel>
                          </TableCell>
                          <TableCell align="left" sx={{ width: '70%' }}></TableCell>
                          <TableCell align="right"><Typography variant="caption" sx={{mr:1}}>Actions</Typography></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody sx={{p:1}}>
                        {(rowsPerPageT1 > 0
                          ? 
                          stableSort(userServers, getComparator(orderT1, orderByT1)).slice(pageT1 * rowsPerPageT1, pageT1 * rowsPerPageT1 + rowsPerPageT1)
                          //userServers.slice(pageT1 * rowsPerPageT1, pageT1 * rowsPerPageT1 + rowsPerPageT1)
                          : userServers
                        ).map((server,indexus) => {
                          const labelId = `enhanced-table-checkbox-${indexus}`;
                          return(
                            <ServerRow server={server} indexus={indexus} labelId={labelId} unregister={unregister} />
                          )})}
                      {/*emptyRowsT1 > 0 && (
                          <TableRow style={{ height: 53 * emptyRowsT1 }}>
                              <TableCell colSpan={4} />
                          </TableRow>
                      )*/}  
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50, 100]}
                            colSpan={3}
                            count={userServers.length}
                            rowsPerPage={rowsPerPageT1}
                            page={pageT1}
                            SelectProps={{
                              inputProps: {
                                'aria-label': 'rows per page',
                              },
                              native: true,
                            }}
                            onPageChange={handleChangePageT1}
                            onRowsPerPageChange={handleChangeRowsPerPageT1}
                            ActionsComponent={TablePaginationActions}
                          />
                        </TableRow>
                      </TableFooter>
                    </StyledTable>
                  </TableContainer>
                </React.Fragment>
                }
                {tab === 1 && 
                  <StyledTable size="small" aria-label="All Servers Table">
                    <MUIDataTable
                      title={""}
                      data={servers}
                      columns={servercolumns}
                      options={serveroptions}
                    />
                  </StyledTable>
                }
              </React.Fragment>
          </Box>
        </Paper>
      </Grid>
    </React.Fragment>
  );
}

export default ServersView;