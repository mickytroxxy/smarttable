import 'react-native-gesture-handler';
import 'react-native-gesture-handler';
import React,{useContext,useState} from 'react';
import { StyleSheet, Platform, Text, View, ActivityIndicator, TextInput, TouchableOpacity, Image, Dimensions, ToastAndroid } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {MaterialIcons,FontAwesome,Feather,AntDesign,Ionicons} from 'react-native-vector-icons';
import * as Animatable from 'react-native-animatable';
import { UserContext } from '../../../components/context'
import * as Font from "expo-font";
import { socket } from '../../../components/socket'
import { Col, Grid } from 'react-native-easy-grid';
import ModalScreen from './Modal';
const HomeScreen = ({navigation}) =>{
    const {userState,showToast,setCarObj,searchResults,setSearchResults,signOutFn,confirmDialog,getNetworkStatus} = useContext(UserContext);
    const [fontsLoaded,setFontsLoaded]=React.useState(false);
    const [Key_Ref,set_Key_Ref]=React.useState("");
    const [isLoading,setIsLoading]=useState(false);
    const [modalStatus, setModalStatus] = useState({isVisible:false,result:null,target:"key-picker"});
    let customFonts = {
        'customLight': require('..//../../fonts/MontserratAlternates-Light.otf'),
        'customBold': require('..//../../fonts/MontserratAlternates-Bold.otf'),
    };
    const loadFontsAsync = async ()=> {
        await Font.loadAsync(customFonts);
        setFontsLoaded(true);
    }
    function closeModal(response) {
        setModalStatus({...modalStatus,isVisible:false});
        if(response){
            loadCarActionsScreen(response);
        }
    }
    let fontFamily = 'sans-serif-thin';
    if(fontsLoaded){
        fontFamily = {customLight:'customLight',customBold:'customBold'};
    }
    let isNowLoading=false;
    const searchKeyRef = (Key_Ref)=>{
        if(Key_Ref!=""){
            setIsLoading(true);
            isNowLoading=true;
            setTimeout(() => {
                if(isNowLoading){
                    isNowLoading=false;
                    showToast("You have poor network connection!");
                    setIsLoading(false);
                }
            }, 8000);
            getNetworkStatus((socket)=>{
                socket.emit("search-keyRef",Key_Ref,true,(result)=>{
                    setIsLoading(false);
                    isNowLoading=false;
                    if(result.length==1){  
                        loadCarActionsScreen(result[0]);
                    }else if(result.length>1){
                        setModalStatus({...modalStatus,isVisible:true,result:result});
                    }else{
                        showToast("No result found");
                    }
                    setSearchResults(null);
                });
            })
        }else{
            showToast("Please enter key ref to proceed!");
        }
    }
    const loadCarActionsScreen = (result)=>{
        setCarObj(result);
        navigation.navigate("CarActionsScreen",{result:result});
    }
    const signOut=()=>{
        confirmDialog("CONFIRM LOGOUT","You are about to log out, Press the logout option to proceed","LOGOUT","CANCEL",(cb)=>{
            if(cb){
                signOutFn();
            }
        })
    }
    React.useEffect(()=>{
        loadFontsAsync();
        if(searchResults){
            searchKeyRef(searchResults.regNo)
        }
    },[searchResults])
    return(
        <View style={styles.container}>
            <View style={{flex:3.7,justifyContent:'center'}}>
                <View style={{width:'98%',height:70,paddingLeft:'1%',flexDirection:'row'}}>
                    <Text style={{fontFamily:fontFamily.customBold,color:'#9293ab',fontSize:24}}>HELLO {userState.userDetails.userId.toUpperCase()}!</Text>
                        <FontAwesome color="green" size={20} name="check-circle" style={{marginTop:9,marginLeft:10}}></FontAwesome>
                </View>
                <View style={{width:'98%',height:70,paddingLeft:'1%'}}>
                    <Grid style={styles.searchInputHolder}>
                        <Col size={0.15} style={{justifyContent:'center',alignContent:'center',alignItems:'center'}}>
                            <TouchableOpacity onPress={()=>navigation.navigate("BarcodeScanner")}>
                                <MaterialIcons name="qr-code-scanner" color="#5586cc" size={36} style={{alignSelf:"center"}}></MaterialIcons>
                            </TouchableOpacity>
                        </Col>
                        <Col style={{justifyContent:'center'}}>
                            <TextInput
                                placeholder="KEY REF OR REG NO" onChangeText={(val)=>set_Key_Ref(val)}
                                style={{borderColor:'#fff',fontFamily:fontFamily.customBold,color:'#757575'}}
                            />
                        </Col>
                        <Col size={0.15} style={{justifyContent:'center',alignContent:'center',alignItems:'center'}}>
                            {!isLoading?(
                                <TouchableOpacity onPress={()=>searchKeyRef(Key_Ref)}><MaterialIcons name="search" color="#5586cc" size={50} style={{alignSelf:"center"}}></MaterialIcons></TouchableOpacity>
                            ):(
                                <ActivityIndicator size="large" color="#757575"></ActivityIndicator>
                            )}
                        </Col>
                    </Grid>
                </View>
                <View style={{width:'98%',height:120,paddingLeft:'1%'}}>
                    <Grid style={{justifyContent:'center',alignItems:'center',alignContent:'center'}}>
                        <Col style={{justifyContent:'center',alignItems:'center',alignContent:'center'}}>
                            <LinearGradient  colors={["#9a9bb6","#e9e6f1","#9a9bb6"]}start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.cardBtn}>
                                <TouchableOpacity onPress={()=>navigation.navigate("ProgressScreen")} style={styles.cardBtn}>
                                    <MaterialIcons size={48} name="trending-up" color="#5586cc"></MaterialIcons>
                                    <Text style={{fontFamily:fontFamily.customLight,color:'#5586cc',fontSize:10,paddingLeft:5}}>PROGRESS</Text>
                                </TouchableOpacity> 
                            </LinearGradient>
                        </Col>
                        <Col style={{justifyContent:'center',alignItems:'center',alignContent:'center'}}>
                            <LinearGradient  colors={["#9a9bb6","#e9e6f1","#9a9bb6"]}start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.cardBtn}>
                                <TouchableOpacity onPress={()=>navigation.navigate("AddItemScreen",{header:"BOOK NEW CLIENT"})} style={styles.cardBtn}>
                                    <AntDesign size={48} name="addfile" color="#5586cc"></AntDesign>
                                    <Text style={{fontFamily:fontFamily.customLight,color:'#5586cc',fontSize:10,paddingLeft:5}}>NEW CLIENT</Text>
                                </TouchableOpacity>   
                            </LinearGradient>
                        </Col>
                        <Col style={{justifyContent:'center',alignItems:'center',alignContent:'center'}}>
                            <LinearGradient  colors={["#9a9bb6","#e9e6f1","#9a9bb6"]}start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.cardBtn}>
                                <TouchableOpacity onPress={()=>navigation.navigate("AddStockScreen",{header:"ADD NEW STOCK"})} style={styles.cardBtn}>
                                    <MaterialIcons size={48} name="add-circle-outline" color="#5586cc"></MaterialIcons>
                                    <Text style={{fontFamily:fontFamily.customLight,color:'#5586cc',fontSize:10,paddingLeft:5}}>NEW STOCK</Text>
                                </TouchableOpacity> 
                            </LinearGradient>
                        </Col>
                        <Col style={{justifyContent:'center',alignItems:'center',alignContent:'center'}}>
                            <LinearGradient  colors={["#9a9bb6","#e9e6f1","#9a9bb6"]}start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.cardBtn}>
                                <TouchableOpacity onPress={()=>navigation.navigate("AddPaintScreen",{header:"ADD NEW PAINT"})} style={styles.cardBtn}>
                                    <Ionicons size={48} name="brush-outline" color="#5586cc"></Ionicons>
                                    <Text style={{fontFamily:fontFamily.customLight,color:'#5586cc',fontSize:10,paddingLeft:5}}>NEW PAINT</Text>
                                </TouchableOpacity> 
                            </LinearGradient>
                        </Col>
                    </Grid>
                </View>
                <View style={{width:'98%',height:120,paddingLeft:'1%'}}>
                    <Grid style={{justifyContent:'center',alignItems:'center',alignContent:'center'}}>
                        <Col style={{justifyContent:'center',alignItems:'center',alignContent:'center'}}>
                            <LinearGradient  colors={["#9a9bb6","#e9e6f1","#9a9bb6"]}start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.cardBtn}>
                                <TouchableOpacity onPress={()=>navigation.navigate("TaskScreen")} style={styles.cardBtn}>
                                    <FontAwesome size={48} name="car" color="#5586cc"></FontAwesome>
                                    <Text style={{fontFamily:fontFamily.customLight,color:'#5586cc',fontSize:10,paddingLeft:5}}>DRIVER'S TASKS</Text>
                                </TouchableOpacity> 
                            </LinearGradient>
                        </Col>
                        <Col style={{justifyContent:'center',alignItems:'center',alignContent:'center'}}>
                            <LinearGradient  colors={["#9a9bb6","#e9e6f1","#9a9bb6"]}start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.cardBtn}>
   
                            </LinearGradient>
                        </Col>
                        <Col style={{justifyContent:'center',alignItems:'center',alignContent:'center'}}>
                            <LinearGradient  colors={["#9a9bb6","#e9e6f1","#9a9bb6"]}start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.cardBtn}>

                            </LinearGradient>
                        </Col>
                        <Col style={{justifyContent:'center',alignItems:'center',alignContent:'center'}}>
                            <LinearGradient  colors={["#9a9bb6","#e9e6f1","#9a9bb6"]}start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.cardBtn}>

                            </LinearGradient>
                        </Col>
                    </Grid>
                </View>
                <ModalScreen modalStatus={modalStatus} closeModal={closeModal}/>
            </View>
            <View style={{flex:0.3,justifyContent:'center',alignContent:'center',alignItems:'center'}}>
                <TouchableOpacity onPress={signOut} style={{justifyContent:'center',alignContent:'center',alignItems:'center'}}>
                    <Feather name="log-out" color="tomato" size={50}></Feather>
                </TouchableOpacity>
            </View>
        </View>
    )
};
export default HomeScreen;
const styles = StyleSheet.create({
    container:{
        flex:1,
        backgroundColor:'#e8e9f5'
    },
    searchInputHolder:{
        height:70,
        borderRadius:20,
        flexDirection:'row',
        borderWidth:3,
        borderColor:'#d0d5dd',
        backgroundColor:'#fff',
    },
    cardBtn:{
        justifyContent:'center',
        alignItems:'center',
        alignContent:'center',
        height:100,
        width:'94%',
        borderRadius:20
    }
});