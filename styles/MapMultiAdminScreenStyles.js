import { StyleSheet } from 'react-native';

const MapMultiAdminScreenStyles = {
  container: {
    height: 180,
    alignItems: 'center',
    bottom: 0,
  },
  header: {
    flex: 1,
	alignItems: 'center',
	top: 0,
	justifyContent: 'center',
  },
  touchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    maxWidth: '90%',
  },
  iconEdit: {
    width: 18,
    height: 18,
    marginLeft: 5,
  },
  containerShow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  showRouteButton: {
    alignItems: 'center',
    backgroundColor: '#6C21DC',
    borderRadius: 5,
    height: 40,
    justifyContent: 'center',
    marginRight: 10,
    width: 160,
  },
  showServicesButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: '#6C21DC',
    borderRadius: 5,
    borderWidth: 2,
    height: 40,
    justifyContent: 'center',
    marginLeft: 10,
    width: 160,
  },
  containerCancelFinish: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cancelEventButton: {
    alignItems: 'center',
    backgroundColor: 'red',
    borderRadius: 5,
    height: 40,
    justifyContent: 'center',
    marginRight: 10,
    width: 160,
  },
  finishEventButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: 'red',
    borderRadius: 5,
    borderWidth: 2,
    height: 40,
    justifyContent: 'center',
    marginLeft: 10,
    width: 160,
  },
  pickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  pickerDorsal: {
    height: 40,
    width: 160,
  },
  calloutContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    justifyContent: 'center',
    padding: 10,
    width: 100,
  },
  calloutText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  horizontal: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10
  },
  marker: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 40,
  },
  markerContainer: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  markerText: {
    color: 'white',
    fontWeight: 'bold',
  },
  spinnerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelledMessage: {
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
    padding: 10,
    alignItems: 'center',
    top: -50,
    height: 50,
  },
  cancelledText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  infoIcon: {
    width: 22,
    height: 22,
    marginLeft: 5,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    width: '100%',
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  textModal: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  labelText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 16,
    marginBottom: 5,
  },
};

export default MapMultiAdminScreenStyles;
