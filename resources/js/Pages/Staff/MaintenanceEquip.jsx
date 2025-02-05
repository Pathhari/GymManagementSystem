import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tabs,
  Tab,
  IconButton,
  Chip
} from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import DomainIcon from "@mui/icons-material/Domain";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const droppableBackground = {
  availableList: "#c8e6c9",
  maintenanceList: "#fff9c4",
  outServiceList: "#ffccbc"
};

const getItemStyle = (isDragging, draggableStyle) => ({
  userSelect: "none",
  padding: 12,
  margin: "0 0 8px 0",
  fontSize: "0.95rem",
  background: isDragging ? "#9c27b0" : "#fafafa",
  color: isDragging ? "#fff" : "#000",
  border: "1px solid #ddd",
  borderRadius: 6,
  transition: "all 0.2s ease",
  cursor: "grab",
  ...draggableStyle
});

const getListStyle = (droppableId, isDraggingOver) => ({
  background: isDraggingOver
    ? "#e0e0e0"
    : droppableBackground[droppableId] || "#f5f5f5",
  padding: 8,
  width: 300,
  minHeight: 380,
  borderRadius: 4,
  transition: "background 0.2s"
});

export default function MaintenanceEquipWithProducts() {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  // Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const clockString = currentTime.toLocaleTimeString();

  // Tabs: 0 = Equipment, 1 = Products
  const [activeTab, setActiveTab] = useState(0);
  const handleTabChange = (e, newVal) => setActiveTab(newVal);

  // Branches
  const [branches, setBranches] = useState([]);
  useEffect(() => {
    fetch("/owner/branches")
      .then((res) => res.json())
      .then((data) => setBranches(data.branches || []))
      .catch((err) => console.error("Error fetching branches:", err));
  }, []);

  const [selectedBranch, setSelectedBranch] = useState("All");

  // -----------------------------------------------------------
  // 1) Equipment + Maintenance
  // -----------------------------------------------------------
  const [equipment, setEquipment] = useState([]);
  const [logs, setLogs] = useState([]);

  const getEquipment = () => {
    fetch("/operations/equipment")
      .then((res) => res.json())
      .then((data) => setEquipment(data.equipment || []))
      .catch((err) => console.error("Error fetching equipment:", err));
  };
  const getLogs = () => {
    fetch("/operations/maintenance-logs")
      .then((res) => res.json())
      .then((data) => setLogs(data.logs || []))
      .catch((err) => console.error("Error fetching logs:", err));
  };

  useEffect(() => {
    getEquipment();
    getLogs();
  }, []);

  // Branch filter
  const filteredEquipment =
    selectedBranch === "All"
      ? equipment
      : equipment.filter((eq) => String(eq.BranchID) === String(selectedBranch));

  // Split by status
  const availableEquip = filteredEquipment.filter((eq) => eq.Status === "Available");
  const maintenanceEquip = filteredEquipment.filter((eq) => eq.Status === "InMaintenance");
  const outOfServiceEquip = filteredEquipment.filter((eq) => eq.Status === "OutOfService");

  // Drag & Drop for equipment
  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index !== destination.index
    ) {
      let updatedList = [];
      if (source.droppableId === "availableList") {
        updatedList = reorder(availableEquip, source.index, destination.index);
        applyReorder(updatedList, "Available");
      } else if (source.droppableId === "maintenanceList") {
        updatedList = reorder(maintenanceEquip, source.index, destination.index);
        applyReorder(updatedList, "InMaintenance");
      } else {
        updatedList = reorder(outOfServiceEquip, source.index, destination.index);
        applyReorder(updatedList, "OutOfService");
      }
      return;
    }
    if (source.droppableId !== destination.droppableId) {
      // Changing status
      handleChangeStatus(source, destination);
    }
  };

  const applyReorder = (newArr, status) => {
    const others = equipment.filter((eq) => eq.Status !== status);
    const final = [...others, ...newArr.map((item) => ({ ...item, Status: status }))];
    setEquipment(final);
  };

  const getListFromId = (id) => {
    if (id === "availableList") return availableEquip;
    if (id === "maintenanceList") return maintenanceEquip;
    return outOfServiceEquip;
  };

  // Status change modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusData, setStatusData] = useState({
    EquipmentID: null,
    oldStatus: "",
    newStatus: "",
    reason: "",
    date: "",
    time: ""
  });
  const [modalEquipItem, setModalEquipItem] = useState(null);

  const handleChangeStatus = (source, destination) => {
    const srcList = getListFromId(source.droppableId);
    const [moved] = srcList.splice(source.index, 1);

    let newStatus = "Available";
    if (destination.droppableId === "maintenanceList") newStatus = "InMaintenance";
    if (destination.droppableId === "outServiceList") newStatus = "OutOfService";

    setModalEquipItem(moved);
    setStatusData({
      EquipmentID: moved.EquipmentID,
      oldStatus: moved.Status,
      newStatus,
      reason: "",
      date: "",
      time: ""
    });
    setStatusModalOpen(true);
  };

  const saveStatusChange = () => {
    // For example, update equipment status, optionally create a maintenance log
    const { EquipmentID, oldStatus, newStatus, reason, date, time } = statusData;
    if (!EquipmentID || !date || !time) {
      alert("Please specify date/time");
      return;
    }
    const eq = modalEquipItem || {};
    const updatePayload = {
      EquipmentID: eq.EquipmentID,
      Name: eq.Name,
      SerialNumber: eq.SerialNumber,
      Status: newStatus,
      BranchID: eq.BranchID
    };

    fetch("/operations/equipment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": csrfToken,
        "X-Requested-With": "XMLHttpRequest"
      },
      body: JSON.stringify(updatePayload)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update equipment.");
        // If going to maintenance or out of service, create log
        if (newStatus === "InMaintenance" || newStatus === "OutOfService") {
          const logPayload = {
            EquipmentID,
            MaintenanceDate: date,
            IssueDescription: reason,
            Resolution: "",
            MaintainedBy: null,
            NextMaintenanceDate: null,
            Notes: `Status changed from ${oldStatus} to ${newStatus} at ${time}.`
          };
          return fetch("/operations/maintenance-logs", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-TOKEN": csrfToken,
              "X-Requested-With": "XMLHttpRequest"
            },
            body: JSON.stringify(logPayload)
          });
        }
      })
      .then(() => {
        setEquipment((prev) =>
          prev.map((item) =>
            item.EquipmentID === EquipmentID ? { ...item, Status: newStatus } : item
          )
        );
        getLogs();
        setStatusModalOpen(false);
      })
      .catch((err) => {
        console.error(err);
        alert("Error updating status or adding log.");
      });
  };

  // Remove equipment example (optional)
  const removeEquipment = (EquipmentID) => {
    if (!window.confirm("Delete equipment?")) return;
    // Or call a delete route if you have one
    setEquipment((prev) => prev.filter((eq) => eq.EquipmentID !== EquipmentID));
  };

  // -----------------------------------------------------------
  // 2) Products
  // -----------------------------------------------------------
  const [products, setProducts] = useState([]);
  const fetchProducts = () => {
    fetch("/operations/products", {
      headers: { "X-Requested-With": "XMLHttpRequest" }
    })
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch((err) => console.error("Error fetching products:", err));
  };
  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts =
    selectedBranch === "All"
      ? products
      : products.filter((p) => String(p.BranchID) === String(selectedBranch));

  // Add/Edit product
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    ProductID: null,
    ProductName: "",
    Category: "",
    StockLevel: 0,
    ReorderLevel: 0,
    Cost: 0,
    Price: 0,
    BranchID: ""
  });
  const [productError, setProductError] = useState("");

  const openNewProductDialog = () => {
    setProductForm({
      ProductID: null,
      ProductName: "",
      Category: "",
      StockLevel: 0,
      ReorderLevel: 0,
      Cost: 0,
      Price: 0,
      BranchID: ""
    });
    setProductError("");
    setProductDialogOpen(true);
  };

  const handleProductFormChange = (e) => {
    setProductForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const saveProduct = () => {
    if (!productForm.ProductName) {
      setProductError("ProductName required.");
      return;
    }
    fetch("/operations/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": csrfToken,
        "X-Requested-With": "XMLHttpRequest"
      },
      body: JSON.stringify(productForm)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to save product");
        return res.json();
      })
      .then(() => {
        setProductDialogOpen(false);
        fetchProducts();
      })
      .catch((err) => {
        console.error(err);
        setProductError("Error saving product");
      });
  };

  // Stock adjustment
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockForm, setStockForm] = useState({
    ProductID: null,
    QuantityChange: 0,
    ChangeType: "Adjustment",
    Notes: ""
  });
  const [stockError, setStockError] = useState("");

  const openStockAdjustDialog = (prod) => {
    setStockForm({
      ProductID: prod.ProductID,
      QuantityChange: 0,
      ChangeType: "Adjustment",
      Notes: ""
    });
    setStockError("");
    setStockDialogOpen(true);
  };

  const handleStockFormChange = (e) => {
    setStockForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const adjustStock = () => {
    if (!stockForm.ProductID || !stockForm.QuantityChange) {
      setStockError("Need ProductID + QuantityChange > 0");
      return;
    }
    fetch("/operations/products/adjust-stock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": csrfToken,
        "X-Requested-With": "XMLHttpRequest"
      },
      body: JSON.stringify(stockForm)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to adjust stock");
        return res.text();
      })
      .then(() => {
        setStockDialogOpen(false);
        fetchProducts();
      })
      .catch((err) => {
        console.error(err);
        setStockError("Error adjusting stock.");
      });
  };

  // Delete product
  const deleteProduct = (prod) => {
    if (!window.confirm(`Remove ${prod.ProductName}?`)) return;
    fetch(`/operations/products/${prod.ProductID}`, {
      method: "DELETE",
      headers: {
        "X-CSRF-TOKEN": csrfToken,
        "X-Requested-With": "XMLHttpRequest"
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to delete product");
        fetchProducts();
      })
      .catch((err) => console.error(err));
  };

  // -----------------------------------------------------------
  // 3) Rendering
  // -----------------------------------------------------------
  const renderDraggableItem = (item, index) => (
    <Draggable
      key={String(item.EquipmentID)}
      draggableId={String(item.EquipmentID)}
      index={index}
    >
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          variant="outlined"
          sx={{
            ...getItemStyle(snapshot.isDragging, provided.draggableProps.style),
            p: 1.5,
            mb: 1
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="subtitle2">
              <strong>ID: {item.EquipmentID}</strong>
            </Typography>
            <IconButton
              size="small"
              onClick={() => removeEquipment(item.EquipmentID)}
              sx={{ color: "red" }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <strong>{item.Name}</strong>
          </Typography>
          <Typography variant="body2" sx={{ fontSize: 13, color: "text.secondary" }}>
            <ConfirmationNumberIcon fontSize="inherit" sx={{ mr: 0.5 }} />
            {item.SerialNumber}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: 13 }}>
            <DomainIcon fontSize="inherit" sx={{ mr: 0.5 }} />
            {item.BranchID}
          </Typography>
        </Paper>
      )}
    </Draggable>
  );

  const logsToShow = logs.slice(0, 12);

  return (
    <Box sx={{ display: "flex", gap: 3, p: 3, flexWrap: "wrap" }}>
      {/* Left: Branch Filter, Tabs, and main content */}
      <Box sx={{ flex: 1, minWidth: 600 }}>
        {/* Branch filter and clock */}
        <Paper sx={{ p: 2, mb: 2 }} elevation={3}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AccessTimeIcon />
              <Typography variant="body1">{clockString}</Typography>
            </Box>
          </Box>
        </Paper>

        {/* Tabs: 0 => Equipment, 1 => Products */}
        <Paper elevation={3}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Equipment" />
            <Tab label="Products" />
          </Tabs>

          {activeTab === 0 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Equipment Management
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <DragDropContext onDragEnd={onDragEnd}>
                <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                  {/* Available */}
                  <Droppable droppableId="availableList">
                    {(provided, snapshot) => (
                      <Paper
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{ p: 2 }}
                        style={getListStyle("availableList", snapshot.isDraggingOver)}
                      >
                        <Typography variant="h6" textAlign="center" mb={1}>
                          <CheckBoxOutlineBlankIcon /> Available
                        </Typography>
                        {availableEquip.map((eq, idx) => renderDraggableItem(eq, idx))}
                        {provided.placeholder}
                      </Paper>
                    )}
                  </Droppable>

                  {/* In Maintenance */}
                  <Droppable droppableId="maintenanceList">
                    {(provided, snapshot) => (
                      <Paper
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{ p: 2 }}
                        style={getListStyle("maintenanceList", snapshot.isDraggingOver)}
                      >
                        <Typography variant="h6" textAlign="center" mb={1}>
                          <BuildCircleIcon /> In Maintenance
                        </Typography>
                        {maintenanceEquip.map((eq, idx) => renderDraggableItem(eq, idx))}
                        {provided.placeholder}
                      </Paper>
                    )}
                  </Droppable>

                  {/* Out of Service */}
                  <Droppable droppableId="outServiceList">
                    {(provided, snapshot) => (
                      <Paper
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{ p: 2 }}
                        style={getListStyle("outServiceList", snapshot.isDraggingOver)}
                      >
                        <Typography variant="h6" textAlign="center" mb={1}>
                          <ErrorOutlineIcon /> Out of Service
                        </Typography>
                        {outOfServiceEquip.map((eq, idx) => renderDraggableItem(eq, idx))}
                        {provided.placeholder}
                      </Paper>
                    )}
                  </Droppable>
                </Box>
              </DragDropContext>
            </Box>
          )}

          {activeTab === 1 && (
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6">Products</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openNewProductDialog}>
                  Add Product
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {filteredProducts.map((prod) => (
                <Paper
                  key={prod.ProductID}
                  sx={{ p: 1.5, mb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <Box>
                    <Typography variant="subtitle1"><strong>{prod.ProductName}</strong></Typography>
                    <Typography variant="body2" color="text.secondary">
                      Stock: {prod.StockLevel} | Cat: {prod.Category || "N/A"}
                    </Typography>
                  </Box>
                  <Box>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ mr: 1 }}
                      onClick={() => openStockAdjustDialog(prod)}
                    >
                      Adjust Stock
                    </Button>
                    <IconButton size="small" color="error" onClick={() => deleteProduct(prod)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Paper>
      </Box>

      {/* Right: Logs */}
      <Box sx={{ width: 350, maxWidth: "100%" }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Maintenance Logs
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Paper sx={{ p: 2, maxHeight: 600, overflowY: "auto" }}>
          {logsToShow.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No logs available...
            </Typography>
          ) : (
            logsToShow.map((log) => (
              <Paper
                key={log.MaintenanceID}
                sx={{ p: 1.5, mb: 2, backgroundColor: "#333", color: "#fafafa" }}
              >
                <Typography variant="subtitle2">
                  Log #{log.MaintenanceID} | Equip #{log.EquipmentID}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: 13 }}>
                  Date: {log.MaintenanceDate} <br />
                  Issue: {log.IssueDescription || "None"} <br />
                  Resolution: {log.Resolution || "N/A"} <br />
                  Notes: {log.Notes || ""}
                </Typography>
              </Paper>
            ))
          )}
        </Paper>
      </Box>

      {/* Dialog: Status change */}
      <Dialog open={statusModalOpen} onClose={() => setStatusModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Change Equipment Status</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" gutterBottom>
            Changing from "{statusData.oldStatus}" to "{statusData.newStatus}".
          </Typography>
          <TextField
            label="Date"
            name="date"
            type="date"
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={statusData.date}
            onChange={(e) => setStatusData((prev) => ({ ...prev, date: e.target.value }))}
          />
          <TextField
            label="Time"
            name="time"
            type="time"
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={statusData.time}
            onChange={(e) => setStatusData((prev) => ({ ...prev, time: e.target.value }))}
          />
          <TextField
            label="Reason"
            name="reason"
            margin="normal"
            fullWidth
            multiline
            rows={3}
            value={statusData.reason}
            onChange={(e) => setStatusData((prev) => ({ ...prev, reason: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveStatusChange}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Add/Edit product */}
      <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Product</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Product Name"
            name="ProductName"
            fullWidth
            margin="normal"
            value={productForm.ProductName}
            onChange={handleProductFormChange}
          />
          <TextField
            label="Category"
            name="Category"
            fullWidth
            margin="normal"
            value={productForm.Category}
            onChange={handleProductFormChange}
          />
          <TextField
            label="Stock Level"
            name="StockLevel"
            type="number"
            fullWidth
            margin="normal"
            value={productForm.StockLevel}
            onChange={handleProductFormChange}
          />
          <TextField
            label="Reorder Level"
            name="ReorderLevel"
            type="number"
            fullWidth
            margin="normal"
            value={productForm.ReorderLevel}
            onChange={handleProductFormChange}
          />
          <TextField
            label="Cost"
            name="Cost"
            type="number"
            fullWidth
            margin="normal"
            value={productForm.Cost}
            onChange={handleProductFormChange}
          />
          <TextField
            label="Price"
            name="Price"
            type="number"
            fullWidth
            margin="normal"
            value={productForm.Price}
            onChange={handleProductFormChange}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Branch</InputLabel>
            <Select
              label="Select Branch"
              name="BranchID"
              value={productForm.BranchID || ""}
              onChange={handleProductFormChange}
            >
              <MenuItem value="">No Branch</MenuItem>
              {branches.map((b) => (
                <MenuItem key={b.BranchID} value={String(b.BranchID)}>
                  {b.BranchName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {productError && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {productError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveProduct}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Stock Adjustment */}
      <Dialog open={stockDialogOpen} onClose={() => setStockDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Adjust Stock</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Quantity Change"
            name="QuantityChange"
            type="number"
            fullWidth
            margin="normal"
            value={stockForm.QuantityChange}
            onChange={handleStockFormChange}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Change Type</InputLabel>
            <Select
              name="ChangeType"
              label="Change Type"
              value={stockForm.ChangeType}
              onChange={handleStockFormChange}
            >
              <MenuItem value="Adjustment">Adjustment</MenuItem>
              <MenuItem value="Sale">Sale</MenuItem>
              <MenuItem value="Restock">Restock</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Notes"
            name="Notes"
            multiline
            rows={2}
            fullWidth
            margin="normal"
            value={stockForm.Notes}
            onChange={handleStockFormChange}
          />
          {stockError && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {stockError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStockDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={adjustStock}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
