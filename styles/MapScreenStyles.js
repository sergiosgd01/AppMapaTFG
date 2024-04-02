const MapScreenStyles = {
  container: {
    height: 150,
    alignItems: 'center',
    bottom: 0,
  },
  header: {
    flex: 1,
	alignItems: 'center',
	top: 0,
	justifyContent: 'center',
  },
  containerShow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerImproveUpdate: {
    flex: 1,
	flexDirection: 'row',
	bottom: 0,
	justifyContent: 'center',
	alignItems: 'center',
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
    height: 40,
    marginHorizontal: 5,
    width: 160,
    justifyContent: 'center',
  },
  imageStyle: {
    height: 20,
    marginRight: 5,
    width: 20,
  },
  improveLocationButton: {
    alignItems: 'center',
    height: 40,
    width: 160,
    justifyContent: 'center',
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
};

export default MapScreenStyles;