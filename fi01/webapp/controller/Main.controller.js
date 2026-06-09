sap.ui.define([
    "sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/format/DateFormat",
    "sap/m/Token", // MultiInput 에 들어가는 선택값 조각
    "sap/ui/comp/valuehelpdialog/ValueHelpDialog", // F4 팝업
   // "sap/m/Column",
    "sap/m/Text",
    "sap/m/ColumnListItem",
    "sap/ui/table/Column",
    "sap/m/Label"
], (Controller, Filter, FilterOperator, JSONModel, DateFormat, Token, ValueHelpDialog, Text, ColumnListItem, Column, Label) => {
    "use strict";

    return Controller.extend("code.t4.ui5.fi01.controller.Main", {
        onInit() {
            var oData = [
                { Status: "", Description: "" },
                { Status: "LON", Description: "장기지연" },
                { Status: "DEL", Description: "지연" },
                { Status: "WAR", Description: "임박" },
                { Status: "NOR", Description: "정상" }
            ];

            var oModel = new JSONModel(oData);
            this.getView().setModel(oModel, "Status");
        },
        onSearch(oEvent){
            var aFilters = [];
            var oFormat = DateFormat.getDateInstance({
                pattern: "yyyy.MM.dd"
            });

            // Input필드의 값을 읽어온다.
            var sBukrs = this.byId("idBukrs").getValue();
            var sGjahr = this.byId("idGjahr").getValue();
            // var sMonat = this.byId("idMonat").getValue();
            var sDuedat = this.byId("idDuedat");
            var oFromDate = sDuedat.getDateValue();
            var oToDate   = sDuedat.getSecondDateValue();
            var sKunnr = this.byId("idKunnr").getValue().toUpperCase();;
            var sKunnrName = this.byId("idKunnrName").getValue();
            var sDelayStatus = this.byId("idDelayStatus").getSelectedKey();

            if (sBukrs && sBukrs.length > 0) { // 만약에 회사코드가 있고, 길이가 0 이상이면,

                    aFilters.push(new Filter("bukrs", FilterOperator.Contains, sBukrs));

            }
            if (sGjahr && sGjahr.length > 0) { // 만약에 회계연도가 있고, 길이가 0 이상이면,
                aFilters.push(new Filter("gjahr", FilterOperator.Contains, sGjahr));
            }

            if (oFromDate && oToDate) { // 만약에 회계연도가 있고, 길이가 0 이상이면,
                var sFromDate = oFormat.format(oFromDate);
                var sToDate = oFormat.format(oToDate);

                var oNextDate = new Date(oToDate);
                oNextDate.setDate(oNextDate.getDate() + 1);

                aFilters.push(new Filter("duedat", FilterOperator.BT, sFromDate, oNextDate));
            }

            if (sKunnr && sKunnr.length > 0) { // 만약에 고객번호가 있고, 길이가 0 이상이면,
                aFilters.push(new Filter("kunnr", FilterOperator.Contains, sKunnr));
            }

            var aTokens = this.byId("idKunnr").getTokens(); // MultiInput으로 받은 Tokens 가져오기 Array

            if (aTokens.length > 0){

                var aKunnrFilters = []; // Value Help 배열
                aTokens.forEach(function(oToken) {
                    aKunnrFilters.push(
                        new Filter("kunnr", FilterOperator.EQ, oToken.getKey())
                    );
                });

                    aFilters.push(new Filter({ filters: aKunnrFilters, and: false}));
            }

            if (sKunnrName && sKunnrName.length > 0) { // 만약에 고객명이 있고, 길이가 0 이상이면,
                aFilters.push(new Filter("name", FilterOperator.Contains, sKunnrName));
            }

            if (sDelayStatus && sDelayStatus.length > 0) { // 만약에 상태가 있고, 길이가 0 이상이면,
                aFilters.push(new Filter("Delay_status", FilterOperator.EQ, sDelayStatus));
            }

            var oTable = this.byId("idTable");
            var oBinding = oTable.getBinding("items");
            oBinding.filter(aFilters);
                
           console.log(sDelayStatus);
        },
        onReset(){
            // 검색조건 초기화
            this.byId("idBukrs").setValue("");
            this.byId("idGjahr").setValue("");
            this.byId("idDuedat").setValue("");
            this.byId("idKunnr").removeAllTokens();
            this.byId("idKunnrName").setValue("");
            this.byId("idDelayStatus").setSelectedKey("");

            // 테이블 필터 초기화
            var oTable = this.byId("idTable");
            var oBinding = oTable.getBinding("items");

            if (oBinding) {
                oBinding.filter([]);
            }
        },

        // 고객 Value Help 버튼 눌렀을 때 실행
       onValueHelpRequest() {

                var oKunnr = this.byId("idKunnr");

                if (this._oCustomerVH) {
                    this._oCustomerVH.setTokens(oKunnr.getTokens());

                    var oTable = this._oCustomerVH.getTable();
                    
                    // 선택된 것들 
                    if (oTable) {
                        oTable.clearSelection(); // sap.ui.table.Table 기준
                    }

                    if (this._oCustomerVH) {
                        this._oCustomerVH.setTokens([]);
                    }

                    this._oCustomerVH.open();
                    return;
                }

                this.loadFragment({
                    name: "code.t4.ui5.fi01.view.KunnrValueHelp"
                }).then(function (oDialog) {

                    this._oCustomerVH = oDialog;
                    this.getView().addDependent(oDialog);

                    var oTable = oDialog.getTable();

                    oTable.setModel(this.getView().getModel());

                    oTable.addColumn(new Column({
                        label: new Label({ text: "고객번호" }),
                        template: new Text({ text: "{BP_part}" })
                    }));

                    oTable.addColumn(new Column({
                        label: new Label({ text: "고객명" }),
                        template: new Text({ text: "{Name}" })
                    }));

                    oTable.bindRows({
                        path: "/ZCDS_D4_FI_0007"
                    });

                    oDialog.setTokens(oKunnr.getTokens());

                    oDialog.open();

                }.bind(this));
            },
            onCustomerVHOk(oEvent) {
                var aTokens = oEvent.getParameter("tokens");

                this.byId("idKunnr").setTokens(aTokens);

                this._oCustomerVH.close();
            },

            onCustomerVHCancel() {
                this._oCustomerVH.close();
            },

            onAll(){
                var oTable = this.byId("idTable");
                var oBinding = oTable.getBinding("items");

                oBinding.filter([]);
            },

            onLongDelay(oEvent){
                var sStatus = oEvent.getSource().data("delayStatus");
                var oTable = this.byId("idTable"); 
                var oBinding = oTable.getBinding("items"); // sap.m.Table 기준
                var aFilters = []; 

                if (sStatus) {
                    aFilters.push(new Filter("DelayStatus", FilterOperator.EQ, sStatus));
                }

                oBinding.filter(aFilters);
            },

            onDelay(oEvent){
                var sStatus = oEvent.getSource().data("delayStatus");
                var oTable = this.byId("idTable"); 
                var oBinding = oTable.getBinding("items"); // sap.m.Table 기준
                var aFilters = []; 

                if (sStatus) {
                    aFilters.push(new Filter("DelayStatus", FilterOperator.EQ, sStatus));
                }

                oBinding.filter(aFilters);
            },

            onWarning(oEvent){
                var sStatus = oEvent.getSource().data("delayStatus");
                var oTable = this.byId("idTable"); 
                var oBinding = oTable.getBinding("items"); // sap.m.Table 기준
                var aFilters = []; 

                if (sStatus) {
                    aFilters.push(new Filter("DelayStatus", FilterOperator.EQ, sStatus));
                }

                oBinding.filter(aFilters);
            },

            onNormal(oEvent){
                var sStatus = oEvent.getSource().data("delayStatus");
                var oTable = this.byId("idTable"); 
                var oBinding = oTable.getBinding("items"); // sap.m.Table 기준
                var aFilters = []; 

                if (sStatus) {
                    aFilters.push(new Filter("DelayStatus", FilterOperator.EQ, sStatus));
                }

                oBinding.filter(aFilters);
            },

            onStatus(oEvent){
                var sStatus = oEvent.getSource().data("Delay_status");
                var oTable = this.byId("idTable"); 
                var oBinding = oTable.getBinding("items"); // sap.m.Table 기준
                var aFilters = []; 

                if (sStatus) {
                    aFilters.push(new Filter("Delay_status", FilterOperator.EQ, sStatus));
                }

                oBinding.filter(aFilters);

                console.log(sStatus);
            }



            //onCustomerVHAfterClose() {
            //    this._oCustomerVH.destroy();
            //     this._oCustomerVH = null;
            //}

        });
    });