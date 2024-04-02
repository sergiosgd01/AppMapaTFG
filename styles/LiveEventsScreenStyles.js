const LiveEventsScreenStyles = {
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  eventDateTime: {
    color: '#666',
    fontSize: 16,
  },
  eventDetails: {
    flexDirection: 'row',
    position: 'relative',
  },
  eventInfoContainer: {
    flex: 1,
  },
  eventImage: {
    borderRadius: 10,
    height: 100,
    marginRight: 10,
    width: 100,
  },
  eventItem: {
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    paddingVertical: 20,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    top: 0,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  noEventsMessage: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  noEventsText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  picker: {
    height: 40,
    marginBottom: 10,
    width: '40%',
  },
  searchInput: {
    borderColor: 'gray',
    borderWidth: 1,
    height: 40,
    marginBottom: 10,
    paddingHorizontal: 10,
    width: '60%',
  },
  spinner: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  welcomeMessage: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 5,
    bottom: 0,
    elevation: 3,
    left: 0,
    paddingHorizontal: 20,
    paddingVertical: 10,
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 999,
  },
  welcomeText: {
    color: '#333',
    fontSize: 16,
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
    justifyContent: 'center',
    flexDirection: 'row',
    bottom: 0,
    marginBottom: 10,
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

export default LiveEventsScreenStyles;
