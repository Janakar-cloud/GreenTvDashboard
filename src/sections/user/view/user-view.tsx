import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import { getUsers, createUser, deleteUser, updateUser, patchUserStatus } from 'src/api/users';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { emptyRows } from '../utils';
import UserPopup from '../view/user-popup';
import { TableNoData } from '../table-no-data';
import { UserTableRow } from '../user-table-row';
import { UserTableHead } from '../user-table-head';
import { TableEmptyRows } from '../table-empty-rows';
import { UserTableToolbar } from '../user-table-toolbar';

import type { UserProps } from '../user-table-row';

// ----------------------------------------------------------------------

export function UserView() {
  const table = useTable();

  const [filterName, setFilterName] = useState('');
  const [userDialog, setUserDialog] = useState<{ open: boolean; user?: UserProps | null }>({ open: false, user: null });
  const [users, setUsers] = useState<UserProps[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUsers({
        page: table.page + 1,
        limit: table.rowsPerPage,
        search: filterName || undefined,
        sort: table.orderBy,
        order: table.order,
      });

      const payload = Array.isArray(response) ? response : response.data;
      const meta = Array.isArray(response) ? undefined : response.meta;

      setUsers(
        payload.map((item) => ({
          id: item.id,
          name: item.name,
          role: item.role,
          status: item.status,
          avatarUrl: item.avatarUrl ?? '',
          isVerified: Boolean(item.isVerified),
        }))
      );
      setTotal(meta?.total ?? payload.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load users';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filterName, table.order, table.orderBy, table.page, table.rowsPerPage]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const notFound = !users.length && !!filterName;

  return (
    <DashboardContent>
      <Box
        sx={{
          mb: 5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Users
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          onClick={() => setUserDialog({ open: true, user: null })}
          startIcon={<Iconify icon="mingcute:add-line" />}
        >
          New user
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {mutationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {mutationError}
        </Alert>
      )}

      <Card>
        <UserTableToolbar
          numSelected={table.selected.length}
          filterName={filterName}
          onFilterName={(event: React.ChangeEvent<HTMLInputElement>) => {
            setFilterName(event.target.value);
            table.onResetPage();
          }}
          onDeleteSelected={async () => {
            if (!window.confirm(`Delete ${table.selected.length} selected user(s)?`)) return;
            setSubmitting(true);
            setMutationError(null);
            try {
              await Promise.all(table.selected.map((id) => deleteUser(id)));
              table.onSelectAllRows(false, []);
              loadUsers();
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Unable to delete users';
              setMutationError(message);
            } finally {
              setSubmitting(false);
            }
          }}
        />

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <UserTableHead
                order={table.order}
                orderBy={table.orderBy}
                rowCount={total}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    users.map((user) => user.id)
                  )
                }
                headLabel={[
                  { id: 'name', label: 'Name' },
                  // { id: 'company', label: 'Company' },
                  { id: 'role', label: 'Role' },
                  { id: 'isVerified', label: 'Verified', align: 'center' },
                  { id: 'status', label: 'Status' },
                  { id: '' },
                ]}
              />
              <TableBody>
                {loading ? (
                  <TableRowLoading rows={table.rowsPerPage} />
                ) : (
                  users.map((row) => (
                    <UserTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                      onEdit={() => setUserDialog({ open: true, user: row })}
                      onDelete={async () => {
                        if (!window.confirm('Delete this user?')) return;
                        setSubmitting(true);
                        setMutationError(null);
                        try {
                          await deleteUser(row.id);
                          loadUsers();
                        } catch (err) {
                          const message = err instanceof Error ? err.message : 'Unable to delete user';
                          setMutationError(message);
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                      onToggleStatus={async () => {
                        setSubmitting(true);
                        setMutationError(null);
                        try {
                          const next = row.status === 'active' ? 'inactive' : 'active';
                          await patchUserStatus(row.id, next);
                          loadUsers();
                        } catch (err) {
                          const message = err instanceof Error ? err.message : 'Unable to update status';
                          setMutationError(message);
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                    />
                  ))
                )}

                <TableEmptyRows
                  height={68}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, total)}
                />

                {notFound && <TableNoData searchQuery={filterName} />}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          component="div"
          page={table.page}
          count={total}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          rowsPerPageOptions={[5, 10, 25]}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
      {userDialog.open ? (
        <UserPopup
          open={userDialog.open}
          initialData={userDialog.user || undefined}
          onClose={() => setUserDialog({ open: false, user: null })}
          onSave={async (data) => {
            setSubmitting(true);
            setMutationError(null);
            try {
              if (userDialog.user) {
                await updateUser(userDialog.user.id, {
                  name: data.name,
                  role: data.role,
                  status: data.status,
                });
              } else {
                await createUser({
                  email: data.email,
                  password: data.password ?? '',
                  role: data.role,
                  name: data.name,
                  status: data.status,
                });
              }
              loadUsers();
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Unable to save user';
              setMutationError(message);
            } finally {
              setSubmitting(false);
            }
          }}
        />
      ) : null}
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function TableRowLoading({ rows }: { rows: number }) {
  return (
    <>
      {Array.from({ length: Math.max(1, rows) }).map((_, index) => (
        <TableRow key={index}>
          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
            <CircularProgress size={24} />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ----------------------------------------------------------------------

export function useTable() {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState('name');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const onSort = useCallback(
    (id: string) => {
      const isAsc = orderBy === id && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(id);
    },
    [order, orderBy]
  );

  const onSelectAllRows = useCallback((checked: boolean, newSelecteds: string[]) => {
    if (checked) {
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  }, []);

  const onSelectRow = useCallback(
    (inputValue: string) => {
      const newSelected = selected.includes(inputValue)
        ? selected.filter((value) => value !== inputValue)
        : [...selected, inputValue];

      setSelected(newSelected);
    },
    [selected]
  );

  const onResetPage = useCallback(() => {
    setPage(0);
  }, []);

  const onChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const onChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      onResetPage();
    },
    [onResetPage]
  );

  return {
    page,
    order,
    onSort,
    orderBy,
    selected,
    rowsPerPage,
    onSelectRow,
    onResetPage,
    onChangePage,
    onSelectAllRows,
    onChangeRowsPerPage,
  };
}
