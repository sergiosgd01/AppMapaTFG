const MapMultiScreenStyles = {
  container: {
    flex: 0.25,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  header: {
  	alignItems: 'center',
  	top: 0,
  	backgroundColor: 'red',
  },
  containerShow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'blue',
  },
  containerPickerUpdate: {
  	flexDirection: 'row',
  	backgroundColor: 'green',
  	bottom: 0,
  },
  activeButton: {
    opacity: 0.8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
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
  commonButton: {
    alignItems: 'center',
    height: '65%',
    justifyContent: 'center',
    marginHorizontal: 5,
    width: '45%',
  },
  showRouteButton: {
    alignItems: 'center',
    backgroundColor: '#6C21DC',
    borderRadius: 5,
    height: '65%',
    justifyContent: 'center',
    marginRight: 10,
    width: '40%',
  },
  showServicesButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: '#6C21DC',
    borderRadius: 5,
    borderWidth: 2,
    height: '65%',
    justifyContent: 'center',
    marginLeft: 10,
    width: '40%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  horizontal: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10
  },
  imageStyle: {
    height: 20,
    marginRight: 5,
    width: 20,
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
    flex: 1,
    justifyContent: "center"
  },
  cancelledMessage: {
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
    padding: 10,
    alignItems: 'center',
    top: 0,
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
};

export default MapMultiScreenStyles;
