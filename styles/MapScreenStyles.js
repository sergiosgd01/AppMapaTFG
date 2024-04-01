const MapScreenStyles = {
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
  containerImproveUpdate: {
	flexDirection: 'row',
	bottom: 0,
	backgroundColor: 'green',
  },
  activeButton: {
    opacity: 0.8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  commonButton: {
    alignItems: 'center',
    height: '65%',
    justifyContent: 'center',
    marginHorizontal: 5,
    width: '45%',
  },
  imageStyle: {
    height: 20,
    marginRight: 5,
    width: 20,
  },
  improveLocationButton: {
    alignItems: 'center',
    height: '65%',
    justifyContent: 'center',
    marginTop: 5,
    width: '45%',
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
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

export default MapScreenStyles;