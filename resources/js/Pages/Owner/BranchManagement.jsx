import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  useTheme
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function BranchManagement() {
  const theme = useTheme();

  // General loading & error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Searching & exporting
  const [searchTerm, setSearchTerm] = useState("");
  const [exportAnchorEl, setExportAnchorEl] = useState(null);

  // Tab state: 0 = Branches, 1 = Facilities
  const [activeTab, setActiveTab] = useState(0);

  // ============ Branch State & CRUD ============
  const [branches, setBranches] = useState([]);
  const [isAddBranchOpen, setAddBranchOpen] = useState(false);
  const [newBranch, setNewBranch] = useState({
    BranchName: "",
    Location: "",
    Status: "Active",
    Contact: "",
  });
  const [isEditBranchOpen, setEditBranchOpen] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [isViewBranchOpen, setViewBranchOpen] = useState(false);
  const [viewBranch, setViewBranch] = useState(null);

  // ============ Facility State & CRUD ============
  const [facilities, setFacilities] = useState([]);
  const [isAddFacilityOpen, setAddFacilityOpen] = useState(false);
  const [newFacility, setNewFacility] = useState({
    BranchID: "",
    FacilityName: "",
    Description: "",
    Status: "Available",
  });
  const [isEditFacilityOpen, setEditFacilityOpen] = useState(false);
  const [editFacility, setEditFacility] = useState(null);
  const [isViewFacilityOpen, setViewFacilityOpen] = useState(false);
  const [viewFacility, setViewFacility] = useState(null);

  // ============ Lifecycle: Fetch on Mount ============
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [branchRes, facilityRes] = await Promise.all([
        axios.get(route("branches.index")),     // e.g. returns {branches: [...]}
        axios.get(route("facilities.index"))    // e.g. returns {facilities: [...]}
      ]);

      setBranches(branchRes.data.branches || []);
      setFacilities(facilityRes.data.facilities || []);

      setLoading(false);
    } catch (err) {
      setError("Failed to load data");
      console.error("Data fetch error:", err);
      setLoading(false);
    }
  };

  // ============ Branch CRUD ============
  const handleCreateBranch = async () => {
    try {
      const res = await axios.post(route("branches.store"), newBranch);
      // res.data is the newly created branch
      setBranches((prev) => [...prev, res.data]);
      setAddBranchOpen(false);
    } catch (err) {
      console.error("Create branch failed:", err);
    }
  };

  const handleUpdateBranch = async () => {
    try {
      const res = await axios.put(route("branches.update", editBranch.BranchID), editBranch);
      setBranches((prev) =>
        prev.map((b) => (b.BranchID === res.data.BranchID ? res.data : b))
      );
      setEditBranchOpen(false);
    } catch (err) {
      console.error("Update branch failed:", err);
    }
  };

  const handleDeleteBranch = async (branchID) => {
    try {
      await axios.delete(route("branches.destroy", branchID));
      setBranches((prev) => prev.filter((b) => b.BranchID !== branchID));
    } catch (err) {
      console.error("Delete branch failed:", err);
    }
  };

  // ============ Facility CRUD ============
  const handleCreateFacility = async () => {
    try {
      const res = await axios.post(route("facilities.store"), newFacility);
      setFacilities((prev) => [...prev, res.data]);
      setAddFacilityOpen(false);
    } catch (err) {
      console.error("Create facility failed:", err);
    }
  };

  const handleUpdateFacility = async () => {
    try {
      const res = await axios.put(route("facilities.update", editFacility.FacilityID), editFacility);
      setFacilities((prev) =>
        prev.map((f) => (f.FacilityID === res.data.FacilityID ? res.data : f))
      );
      setEditFacilityOpen(false);
    } catch (err) {
      console.error("Update facility failed:", err);
    }
  };

  const handleDeleteFacility = async (facilityID) => {
    try {
      await axios.delete(route("facilities.destroy", facilityID));
      setFacilities((prev) => prev.filter((f) => f.FacilityID !== facilityID));
    } catch (err) {
      console.error("Delete facility failed:", err);
    }
  };

  // ============ Columns & Tab Logic ============
  const branchColumns = [
    { field: "BranchID", headerName: "ID", width: 80 },
    { field: "BranchName", headerName: "Branch Name", width: 180 },
    { field: "Location", headerName: "Location", width: 180 },
    {
      field: "Status",
      headerName: "Status",
      width: 100,
      renderCell: (params) => {
        const val = params.value;
        return val === "Active" ? (
          <span style={{ color: "green" }}>Active</span>
        ) : (
          <span style={{ color: "gray" }}>{val}</span>
        );
      },
    },
    { field: "Contact", headerName: "Contact", width: 140 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 240,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View Branch">
            <Button
              variant="outlined"
              size="small"
              color="success"
              onClick={() => {
                setViewBranch(params.row);
                setViewBranchOpen(true);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Edit Branch">
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setEditBranch({ ...params.row });
                setEditBranchOpen(true);
              }}
            >
              <EditIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Delete Branch">
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={() => handleDeleteBranch(params.row.BranchID)}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const facilityColumns = [
    { field: "FacilityID", headerName: "ID", width: 80 },
    { field: "FacilityName", headerName: "Facility Name", width: 180 },
    { field: "Description", headerName: "Description", width: 220 },
    {
      field: "Status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => {
        const val = params.value;
        if (val === "Available") return <span style={{ color: "green" }}>Available</span>;
        if (val === "Under Maintenance")
          return <span style={{ color: "orange" }}>Maintenance</span>;
        if (val === "Closed") return <span style={{ color: "red" }}>Closed</span>;
        return val;
      },
    },
    {
      field: "BranchID",
      headerName: "Branch",
      width: 130,
      renderCell: (params) => {
        // If you eager-loaded 'branch' in the controller, you can do:
        const row = params.row;
        return row.branch ? row.branch.BranchName : "—";
      },
    },
    {
      field: "Actions",
      headerName: "Actions",
      width: 240,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View Facility">
            <Button
              variant="outlined"
              size="small"
              color="success"
              onClick={() => {
                setViewFacility(params.row);
                setViewFacilityOpen(true);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Edit Facility">
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setEditFacility({ ...params.row });
                setEditFacilityOpen(true);
              }}
            >
              <EditIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Delete Facility">
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={() => handleDeleteFacility(params.row.FacilityID)}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Determine which columns & data to show based on the active tab
  let tableColumns = [];
  let tableRows = [];
  let csvHeaders = [];
  let csvFilename = "";

  if (activeTab === 0) {
    // Branch Tab
    tableColumns = branchColumns;
    tableRows = branches;
    csvHeaders = [
      { label: "BranchID", key: "BranchID" },
      { label: "BranchName", key: "BranchName" },
      { label: "Location", key: "Location" },
      { label: "Status", key: "Status" },
      { label: "Contact", key: "Contact" },
    ];
    csvFilename = "BranchDirectory.csv";
  } else {
    // Facilities Tab
    tableColumns = facilityColumns;
    tableRows = facilities;
    csvHeaders = [
      { label: "FacilityID", key: "FacilityID" },
      { label: "FacilityName", key: "FacilityName" },
      { label: "Description", key: "Description" },
      { label: "Status", key: "Status" },
    ];
    csvFilename = "Facilities.csv";
  }

  // Filter rows by searchTerm
  const filteredRows = tableRows.filter((row) =>
    Object.values(row).join(" ").toLowerCase().includes(searchTerm)
  );

  // ============ Export PDF =============
  const handleExportMenuOpen = (event) => setExportAnchorEl(event.currentTarget);
  const handleExportMenuClose = () => setExportAnchorEl(null);

  const handleExportPDF = () => {
    handleExportMenuClose();
    const doc = new jsPDF();

    if (activeTab === 0) {
      // Branch PDF
      doc.text("Branch Directory Export", 14, 10);
      const body = branches.map((b) => [
        b.BranchID,
        b.BranchName,
        b.Location,
        b.Status,
        b.Contact,
      ]);
      doc.autoTable({
        head: [["ID", "Name", "Location", "Status", "Contact"]],
        body,
        startY: 20,
      });
      doc.save("BranchDirectory.pdf");
    } else {
      // Facility PDF
      doc.text("Facilities Export", 14, 10);
      const body = facilities.map((f) => [
        f.FacilityID,
        f.FacilityName,
        f.Description,
        f.Status,
      ]);
      doc.autoTable({
        head: [["ID", "Name", "Description", "Status"]],
        body,
        startY: 20,
      });
      doc.save("Facilities.pdf");
    }
  };

  // ============ Handlers for Tab & Search ============
  const handleTabChange = (event, newVal) => {
    setActiveTab(newVal);
    setSearchTerm("");
  };
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  // ============ UI =============
  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
          Branch & Facility Management
        </Typography>

        {/* Tabs: 0=Branches, 1=Facilities */}
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Branches" />
          <Tab label="Facilities" />
        </Tabs>
      </Box>

      {/* Search & Export */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <TextField
          placeholder="Search..."
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ width: "100%", maxWidth: 300 }}
        />
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportMenuOpen}
            sx={{ textTransform: "none" }}
          >
            Export
          </Button>
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={handleExportMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          >
            <MenuItem>
              <CSVLink
                data={filteredRows}
                headers={csvHeaders}
                filename={csvFilename}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                Export CSV
              </CSVLink>
            </MenuItem>
            <MenuItem onClick={handleExportPDF}>Export PDF</MenuItem>
          </Menu>

          {/* Add button depends on tab */}
          {activeTab === 0 ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setAddBranchOpen(true)}
            >
              Add Branch
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setAddFacilityOpen(true)}
            >
              Add Facility
            </Button>
          )}
        </Box>
      </Box>

      {/* DataGrid */}
      <Paper elevation={3} sx={{ width: "100%", height: 450 }}>
        <DataGrid
          rows={filteredRows}
          columns={tableColumns}
          getRowId={(row) =>
            activeTab === 0 ? row.BranchID : row.FacilityID
          }
          pageSize={5}
          rowsPerPageOptions={[5, 10]}
          loading={loading}
        />
      </Paper>

      {/* ========== Branch Dialogs ========== */}
      {/* Add Branch */}
      <Dialog open={isAddBranchOpen} onClose={() => setAddBranchOpen(false)}>
        <DialogTitle>Add Branch</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Branch Name"
            fullWidth
            margin="normal"
            size="small"
            value={newBranch.BranchName}
            onChange={(e) =>
              setNewBranch((prev) => ({ ...prev, BranchName: e.target.value }))
            }
          />
          <TextField
            label="Location"
            fullWidth
            margin="normal"
            size="small"
            value={newBranch.Location}
            onChange={(e) =>
              setNewBranch((prev) => ({ ...prev, Location: e.target.value }))
            }
          />
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={newBranch.Status}
              onChange={(e) =>
                setNewBranch((prev) => ({ ...prev, Status: e.target.value }))
              }
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Closed">Closed</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Contact"
            fullWidth
            margin="normal"
            size="small"
            value={newBranch.Contact}
            onChange={(e) =>
              setNewBranch((prev) => ({ ...prev, Contact: e.target.value }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddBranchOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateBranch}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Branch */}
      <Dialog
        open={isEditBranchOpen}
        onClose={() => setEditBranchOpen(false)}
      >
        <DialogTitle>Edit Branch</DialogTitle>
        <DialogContent dividers>
          {editBranch && (
            <>
              <TextField
                label="Branch Name"
                fullWidth
                margin="normal"
                size="small"
                value={editBranch.BranchName || ""}
                onChange={(e) =>
                  setEditBranch((prev) => ({
                    ...prev,
                    BranchName: e.target.value,
                  }))
                }
              />
              <TextField
                label="Location"
                fullWidth
                margin="normal"
                size="small"
                value={editBranch.Location || ""}
                onChange={(e) =>
                  setEditBranch((prev) => ({
                    ...prev,
                    Location: e.target.value,
                  }))
                }
              />
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={editBranch.Status || "Active"}
                  onChange={(e) =>
                    setEditBranch((prev) => ({
                      ...prev,
                      Status: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Closed">Closed</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Contact"
                fullWidth
                margin="normal"
                size="small"
                value={editBranch.Contact || ""}
                onChange={(e) =>
                  setEditBranch((prev) => ({
                    ...prev,
                    Contact: e.target.value,
                  }))
                }
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditBranchOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateBranch}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Branch */}
      <Dialog
        open={isViewBranchOpen}
        onClose={() => setViewBranchOpen(false)}
      >
        <DialogTitle>View Branch</DialogTitle>
        <DialogContent dividers>
          {viewBranch && (
            <Box sx={{ p: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Branch ID:
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {viewBranch.BranchID}
              </Typography>

              <Typography variant="body2" color="textSecondary">
                Name:
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {viewBranch.BranchName}
              </Typography>

              <Typography variant="body2" color="textSecondary">
                Location:
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {viewBranch.Location}
              </Typography>

              <Typography variant="body2" color="textSecondary">
                Status:
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {viewBranch.Status}
              </Typography>

              <Typography variant="body2" color="textSecondary">
                Contact:
              </Typography>
              <Typography variant="body1">
                {viewBranch.Contact}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setViewBranchOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========== Facility Dialogs ========== */}
      {/* Add Facility */}
      <Dialog
        open={isAddFacilityOpen}
        onClose={() => setAddFacilityOpen(false)}
      >
        <DialogTitle>Add Facility</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel>Branch</InputLabel>
            <Select
              label="Branch"
              value={newFacility.BranchID}
              onChange={(e) =>
                setNewFacility((prev) => ({ ...prev, BranchID: e.target.value }))
              }
            >
              <MenuItem value="">
                <em>-- None --</em>
              </MenuItem>
              {branches.map((b) => (
                <MenuItem key={b.BranchID} value={b.BranchID}>
                  {b.BranchName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Facility Name"
            fullWidth
            margin="normal"
            size="small"
            value={newFacility.FacilityName}
            onChange={(e) =>
              setNewFacility((prev) => ({
                ...prev,
                FacilityName: e.target.value,
              }))
            }
          />
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            size="small"
            multiline
            rows={2}
            value={newFacility.Description}
            onChange={(e) =>
              setNewFacility((prev) => ({
                ...prev,
                Description: e.target.value,
              }))
            }
          />
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={newFacility.Status}
              onChange={(e) =>
                setNewFacility((prev) => ({
                  ...prev,
                  Status: e.target.value,
                }))
              }
            >
              <MenuItem value="Available">Available</MenuItem>
              <MenuItem value="Under Maintenance">Under Maintenance</MenuItem>
              <MenuItem value="Closed">Closed</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddFacilityOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateFacility}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Facility */}
      <Dialog
        open={isEditFacilityOpen}
        onClose={() => setEditFacilityOpen(false)}
      >
        <DialogTitle>Edit Facility</DialogTitle>
        <DialogContent dividers>
          {editFacility && (
            <>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Branch</InputLabel>
                <Select
                  label="Branch"
                  value={editFacility.BranchID || ""}
                  onChange={(e) =>
                    setEditFacility((prev) => ({
                      ...prev,
                      BranchID: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="">
                    <em>-- None --</em>
                  </MenuItem>
                  {branches.map((b) => (
                    <MenuItem key={b.BranchID} value={b.BranchID}>
                      {b.BranchName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Facility Name"
                fullWidth
                margin="normal"
                size="small"
                value={editFacility.FacilityName || ""}
                onChange={(e) =>
                  setEditFacility((prev) => ({
                    ...prev,
                    FacilityName: e.target.value,
                  }))
                }
              />
              <TextField
                label="Description"
                fullWidth
                margin="normal"
                size="small"
                multiline
                rows={2}
                value={editFacility.Description || ""}
                onChange={(e) =>
                  setEditFacility((prev) => ({
                    ...prev,
                    Description: e.target.value,
                  }))
                }
              />
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={editFacility.Status || "Available"}
                  onChange={(e) =>
                    setEditFacility((prev) => ({
                      ...prev,
                      Status: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="Available">Available</MenuItem>
                  <MenuItem value="Under Maintenance">Under Maintenance</MenuItem>
                  <MenuItem value="Closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditFacilityOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateFacility}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Facility */}
      <Dialog
        open={isViewFacilityOpen}
        onClose={() => setViewFacilityOpen(false)}
      >
        <DialogTitle>View Facility</DialogTitle>
        <DialogContent dividers>
          {viewFacility && (
            <Box sx={{ p: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Facility ID:
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {viewFacility.FacilityID}
              </Typography>

              <Typography variant="body2" color="textSecondary">
                Facility Name:
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {viewFacility.FacilityName}
              </Typography>

              <Typography variant="body2" color="textSecondary">
                Description:
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {viewFacility.Description}
              </Typography>

              <Typography variant="body2" color="textSecondary">
                Status:
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {viewFacility.Status}
              </Typography>

              <Typography variant="body2" color="textSecondary">
                Branch:
              </Typography>
              <Typography variant="body1">
                {viewFacility.branch ? viewFacility.branch.BranchName : "—"}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setViewFacilityOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
