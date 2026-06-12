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
                // var sFromDate = oFormat.format(oFromDate);
                // var sToDate = oFormat.format(oToDate);

                // alert(sFromDate);

                var oNextDate = new Date(oToDate);
                oNextDate.setDate(oNextDate.getDate() + 1);

                // aFilters.push(new Filter("duedat", FilterOperator.BT, sFromDate, oNextDate));
                aFilters.push(new Filter("duedat", FilterOperator.BT, oFromDate, oNextDate));
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
                // 고객번호를 입력하는 MultiInput의 객체를 가져온다.
                var oKunnr = this.byId("idKunnr");

                // 현재 고객번호 필드에 들어있는 Token 값을 가져온다. ( 그냥 기본 Input의 값을 가져오는 getValue 느낌 )
                var aTokens = oKunnr.getTokens(); //

                // Value help doalog 가 이미 존재
                if (this._oCustomerVH) {

                    this._oCustomerVH.setTokens([]); // 빈 토큰 세팅( 기존의 Dialog 토큰 제거 => 중복제거를 위함 )
                    this._oCustomerVH.setTokens(aTokens); // Input 에 남아 있는 토큰만 다시 반영

                    this._oCustomerVH.update(); // Dialog 내부 상태를 업데이트함. ( Token 값을 반영하기 위해 )

                    this._oCustomerVH.open(); // Value Help Dialog 열기

                    return;
                }


                // Dialog 생성되지 않은 상태 ( 최초 실행할 때 load Fragment )
                this.loadFragment({
                    name: "code.t4.ui5.fi01.view.KunnrValueHelp"
                }).then(function (oDialog) {

                    // Dialog 객체를 변수에 저장(재사용 목적)
                    this._oCustomerVH = oDialog;

                    // 현재 View 의 Dependent 객체로 등록
                    // Input, Table, Button 처럼 종속적이지 않고 독립적인 개체이기 때문에 종속적인 객체로 등록
                    // View 종료 시에 destroy 된다.
                    // this.getView().addDependent(oDialog);

                    // Dialog 의 Table 가져온다.
                    var oTable = oDialog.getTable();

                    // Main View 의 OData Model 연결
                    oTable.setModel(this.getView().getModel());

                    // Table 에 Column 추가! ( 고객번호 칼럼 )
                    oTable.addColumn(new Column({
                        label: new Label({ text: "고객번호" }),
                        template: new Text({ text: "{BP_part}" })
                    }));

                    // Table 에 Column 추가! ( 고객명 칼럼 )
                    oTable.addColumn(new Column({
                        label: new Label({ text: "고객명" }),
                        template: new Text({ text: "{Name}" })
                    }));

                    // OData EntitySet 을 바인딩
                    oTable.bindRows({
                        path: "/ZCDS_D4_FI_0007"
                    });

                    // 현재 Input 에 있는 Token 상태 Dialog 에도 반영
                    // 최초 실행 시 선택 상태를 유지한다.
                    oDialog.setTokens(aTokens);
                    oDialog.open();

                }.bind(this));
            },

            // MultiInput Token이 추가/삭제되는 경우에 실행한다.
            onCustomerTokenUpdate() {

                // Value Help Dialog 가 존재할 때만
                if (this._oCustomerVH) {

                    // 현재 Input 필드의 Token 상태를 Dialog 내부 Token 상태와 동기화 시킨다.
                    this._oCustomerVH.setTokens(this.byId("idKunnr").getTokens());
                }
            },

            // Dialog 에서 선택한 Token 목록을 가져온다.
            onCustomerVHOk(oEvent) {
                // Dialog 에서 선택한 Token 목록을 가져온다.
                var aTokens = oEvent.getParameter("tokens");

                // 중복제거를 위한 Object
                var mSeen = {};

                // 최종적으로 저장할 중복 제거된 Token 배열 => [] 를 사용하여 배열 변수를 선언
                var aUniqueTokens = [];

                // Token 하나하나 중복 제거
                aTokens.forEach(function (oToken) {
                    
                    // Key값이 처음 나왔을 때만 추가한다. 이미 있는 값이 아니고 새로운 값이 추가됐을 때!
                    if (!mSeen[oToken.getKey()]) {
                        mSeen[oToken.getKey()] = true;
                        aUniqueTokens.push(oToken);
                    }
                });

                // Token을 고객번호 필드에 세팅한다.
                this.byId("idKunnr").setTokens(aUniqueTokens);

                // Dialog 내부 Token 을 초기화한다. (새로 오픈할 때에 중복되어 누적되는 것을 방지)
                this._oCustomerVH.setTokens([]);

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